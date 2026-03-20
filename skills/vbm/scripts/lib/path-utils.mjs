import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const PROJECT_MARKERS = [
  ".git",
  "package.json",
  "pnpm-workspace.yaml",
  "pom.xml",
  "build.gradle",
  "settings.gradle",
  "pyproject.toml",
  "requirements.txt",
  "Cargo.toml",
  "go.mod",
  "composer.json",
  "Gemfile",
  "Makefile"
];

export async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

export async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function readTextMaybe(targetPath) {
  if (!(await fileExists(targetPath))) {
    return "";
  }

  return fs.readFile(targetPath, "utf8");
}

export async function writeText(targetPath, content) {
  await ensureDir(path.dirname(targetPath));
  await fs.writeFile(targetPath, content, "utf8");
}

export async function copyDir(sourceDir, targetDir, options = {}) {
  const { skipExisting = false } = options;

  await ensureDir(targetDir);
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath, options);
      continue;
    }

    if (skipExisting && (await fileExists(targetPath))) {
      continue;
    }

    await ensureDir(path.dirname(targetPath));
    await fs.copyFile(sourcePath, targetPath);
  }
}

function normalizeLookupStart(targetPath) {
  try {
    const stats = fsSync.statSync(targetPath);
    return stats.isDirectory() ? targetPath : path.dirname(targetPath);
  } catch {
    return targetPath;
  }
}

function tryResolveGitTopLevel(targetPath) {
  try {
    const output = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: targetPath,
      windowsHide: true,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();

    return output ? path.resolve(output) : "";
  } catch {
    return "";
  }
}

export function findNearestProjectRoot(targetPath) {
  let current = normalizeLookupStart(path.resolve(targetPath));

  while (true) {
    if (PROJECT_MARKERS.some((marker) => fsSync.existsSync(path.join(current, marker)))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return "";
    }

    current = parent;
  }
}

export async function isProjectDirectory(targetPath) {
  const current = normalizeLookupStart(path.resolve(targetPath));

  for (const marker of PROJECT_MARKERS) {
    if (await fileExists(path.join(current, marker))) {
      return true;
    }
  }

  return false;
}

export function resolveProjectPath(projectArg) {
  const resolvedPath = normalizeLookupStart(path.resolve(process.cwd(), projectArg || "."));
  const gitRoot = tryResolveGitTopLevel(resolvedPath);

  if (gitRoot) {
    return gitRoot;
  }

  return findNearestProjectRoot(resolvedPath) || resolvedPath;
}

export function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

export function slugify(value) {
  return String(value || "")
    .trim()
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "记录";
}

export async function ensureUniquePath(targetPath) {
  if (!(await fileExists(targetPath))) {
    return targetPath;
  }

  const directory = path.dirname(targetPath);
  const extension = path.extname(targetPath);
  const baseName = path.basename(targetPath, extension);

  for (let index = 2; ; index += 1) {
    const candidatePath = path.join(directory, `${baseName}-${index}${extension}`);
    if (!(await fileExists(candidatePath))) {
      return candidatePath;
    }
  }
}
