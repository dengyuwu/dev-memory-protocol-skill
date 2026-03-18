import fs from "node:fs/promises";
import path from "node:path";

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

export function resolveProjectPath(projectArg) {
  return path.resolve(process.cwd(), projectArg || ".");
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
