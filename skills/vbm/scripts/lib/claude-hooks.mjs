import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { toPosixPath, writeText } from "./path-utils.mjs";

const VBM_HOOK_TAG = "vbm-managed";

function buildCommand(skillRoot, scriptName, extraArgs = "") {
  const normalizedSkillRoot = toPosixPath(skillRoot);
  const suffix = extraArgs ? ` ${extraArgs}` : "";
  return `node "${normalizedSkillRoot}/scripts/${scriptName}" --project "$CLAUDE_PROJECT_DIR"${suffix}`;
}

function createCommandHook(command, statusMessage, timeout = 120) {
  return {
    type: "command",
    command,
    timeout,
    statusMessage
  };
}

function createMatcherGroup(matcher, hooks) {
  if (matcher) {
    return { matcher, hooks };
  }

  return { hooks };
}

export function buildClaudeHookConfig(skillRoot) {
  return {
    SessionStart: [
      createMatcherGroup(
        "startup|resume|clear|compact",
        [
          createCommandHook(
            buildCommand(skillRoot, "session-start.mjs"),
            `${VBM_HOOK_TAG}: 会话开始同步 vbm`,
            120
          )
        ]
      )
    ],
    SessionEnd: [
      createMatcherGroup(
        "*",
        [
          createCommandHook(
            buildCommand(
              skillRoot,
              "session-close.mjs",
              '--summary "Claude Code 会话结束，vbm 已自动整理本轮记忆。"'
            ),
            `${VBM_HOOK_TAG}: 会话结束整理 vbm`,
            180
          )
        ]
      )
    ]
  };
}

export function resolveClaudeSettingsPath(scope, projectRoot) {
  if (scope === "user") {
    return path.join(os.homedir(), ".claude", "settings.json");
  }

  if (scope === "project") {
    return path.join(projectRoot, ".claude", "settings.json");
  }

  if (scope === "local") {
    return path.join(projectRoot, ".claude", "settings.local.json");
  }

  throw new Error(`不支持的 Claude hook scope：${scope}`);
}

export async function readJsonMaybe(targetPath) {
  try {
    const content = await fs.readFile(targetPath, "utf8");
    return content.trim() ? JSON.parse(content) : {};
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

function isManagedHook(hook) {
  return String(hook?.statusMessage || "").startsWith(`${VBM_HOOK_TAG}:`);
}

function cleanupHooks(groups = []) {
  return groups
    .map((group) => ({
      ...group,
      hooks: Array.isArray(group.hooks) ? group.hooks.filter((hook) => !isManagedHook(hook)) : []
    }))
    .filter((group) => Array.isArray(group.hooks) && group.hooks.length > 0);
}

export function upsertClaudeHooks(settings, managedHooks) {
  const next = { ...settings, hooks: { ...(settings.hooks || {}) } };

  for (const [eventName, groups] of Object.entries(managedHooks)) {
    const cleaned = cleanupHooks(next.hooks[eventName] || []);
    next.hooks[eventName] = [...cleaned, ...groups];
  }

  return next;
}

export function removeClaudeHooks(settings, managedHooks) {
  if (!settings.hooks) {
    return settings;
  }

  const nextHooks = { ...settings.hooks };
  for (const eventName of Object.keys(managedHooks)) {
    const cleaned = cleanupHooks(nextHooks[eventName] || []);
    if (cleaned.length === 0) {
      delete nextHooks[eventName];
    } else {
      nextHooks[eventName] = cleaned;
    }
  }

  const next = { ...settings };
  if (Object.keys(nextHooks).length === 0) {
    delete next.hooks;
  } else {
    next.hooks = nextHooks;
  }

  return next;
}

export async function writeJson(targetPath, data) {
  await writeText(targetPath, `${JSON.stringify(data, null, 2)}\n`);
}
