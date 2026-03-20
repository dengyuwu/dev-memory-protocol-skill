import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export class GitCommandError extends Error {
  constructor(message, reason = "unknown") {
    super(message);
    this.name = "GitCommandError";
    this.reason = reason;
  }
}

function normalizeGitError(error, projectRoot) {
  const stderr = error.stderr?.toString().trim();
  const message = stderr || error.message || "git command failed";

  if (/dubious ownership/i.test(message)) {
    const safeDirectory = projectRoot.replace(/\\/g, "/");
    return new GitCommandError(
      `git 拒绝访问当前仓库，原因是 dubious ownership。请先执行 git config --global --add safe.directory "${safeDirectory}"，再重试。`,
      "dubious-ownership"
    );
  }

  if (/spawn\s+EPERM/i.test(message) || /operation not permitted/i.test(message)) {
    return new GitCommandError("当前环境禁止脚本直接调用 git 命令。", "command-blocked");
  }

  if (
    /enoent/i.test(message) ||
    /not recognized as an internal or external command/i.test(message) ||
    /command not found/i.test(message)
  ) {
    return new GitCommandError("当前环境未安装 git，或 git 不在 PATH 中。", "git-not-installed");
  }

  if (/not a git repository/i.test(message)) {
    return new GitCommandError("当前目录不是 git 仓库。", "not-a-repository");
  }

  return new GitCommandError(message, "unknown");
}

export async function runGit(projectRoot, args) {
  try {
    const result = await execFileAsync("git", args, {
      cwd: projectRoot,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 8
    });
    return result.stdout.trim();
  } catch (error) {
    throw normalizeGitError(error, projectRoot);
  }
}

export async function isGitRepository(projectRoot) {
  try {
    await runGit(projectRoot, ["rev-parse", "--show-toplevel"]);
    return true;
  } catch {
    try {
      const gitDir = path.join(projectRoot, ".git");
      const stats = await fs.stat(gitDir);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}

export async function listChangedFiles(projectRoot, scope) {
  const files = new Set();

  if (scope === "staged" || scope === "all") {
    for (const line of (await runGit(projectRoot, ["diff", "--cached", "--name-only", "--diff-filter=ACMR"])).split("\n")) {
      if (line.trim()) {
        files.add(line.trim());
      }
    }
  }

  if (scope === "unstaged" || scope === "all") {
    for (const line of (await runGit(projectRoot, ["diff", "--name-only", "--diff-filter=ACMR"])).split("\n")) {
      if (line.trim()) {
        files.add(line.trim());
      }
    }

    for (const line of (await runGit(projectRoot, ["ls-files", "--others", "--exclude-standard"])).split("\n")) {
      if (line.trim()) {
        files.add(line.trim());
      }
    }
  }

  return Array.from(files).sort((left, right) => left.localeCompare(right));
}

export async function readDiff(projectRoot, scope, paths = []) {
  const pathspec = paths.length > 0 ? ["--", ...paths] : [];
  const parts = [];

  if (scope === "staged" || scope === "all") {
    const staged = await runGit(projectRoot, [
      "diff",
      "--cached",
      "--no-ext-diff",
      "--unified=0",
      ...pathspec
    ]);
    if (staged) {
      parts.push(staged);
    }
  }

  if (scope === "unstaged" || scope === "all") {
    const unstaged = await runGit(projectRoot, ["diff", "--no-ext-diff", "--unified=0", ...pathspec]);
    if (unstaged) {
      parts.push(unstaged);
    }
  }

  return parts.join("\n");
}
