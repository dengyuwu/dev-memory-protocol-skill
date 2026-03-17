---
name: dev-memory-protocol
description: Cross-platform development memory workflow for Codex and Claude Code. Use when setting up project memory files, installing an append-only memory protocol from a GitHub repo, initializing .ai memory directories, recalling project knowledge before edits, or capturing verified bug and decision records after implementation.
---

# Development Memory Protocol

Use this skill to install or operate a project-local memory layer for software development.

## Install

1. Read `references/installing.md`.
2. Run `node "<path-to-this-skill>/scripts/install.mjs" --project <target-project>`.
3. Pass `--tool codex`, `--tool claude`, or `--tool both` only when the user explicitly requests one target.
4. Append the managed rule block only. Do not overwrite user rules outside the managed block.
5. Initialize `.ai/` in the target project.

## Enable Global Bootstrap

1. Read `references/global-bootstrap.md`.
2. Run `node "<path-to-this-skill>/scripts/install-global.mjs"`.
3. Let the skill append its managed global bootstrap block to `~/.codex/AGENTS.md`.
4. Use `uninstall-global.mjs` to remove only that managed global block later.

## Install And Enable

1. Use this when the user wants a single follow-up step after skill installation.
2. Run `node "<path-to-this-skill>/scripts/post-install.mjs" --project <target-project>`.
3. This will:
   - enable the managed global bootstrap block in `~/.codex/AGENTS.md`
   - initialize the current project if it looks like a project root and `.ai` is not present yet
4. This does not require waiting for Codex to reload the skill registry before using the scripts directly.

## Uninstall

1. Read `references/uninstalling.md`.
2. Run `node "<path-to-this-skill>/scripts/uninstall.mjs" --project <target-project>`.
3. Remove only the managed rule block from `AGENTS.md`, `CLAUDE.md`, or both.
4. Keep `.ai/` memory files unless the user explicitly asks for a destructive cleanup.

## Operate

- Use `scripts/recall.mjs` before editing code to print baseline memory files and related records for a query.
- Use `scripts/capture.mjs` after a fix or decision to create a structured markdown record.
- Use `scripts/capture-from-diff.mjs` to generate a candidate bug or decision record from current git changes, then add `--write true` only after review.
- Use `scripts/index.mjs` or `scripts/compact.mjs` to rebuild `.ai/index/` after bulk edits.

## References

- Read `references/installing.md` when initializing a project from an already-installed skill.
- Read `references/global-bootstrap.md` when enabling or disabling global bootstrap from an installed skill.
- Read `references/uninstalling.md` when removing the protocol from a project.
- Read `references/protocol.md` for the memory layout and installation contract.
- Read `references/writeback-policy.md` before writing back memory records.
- Read `references/hook-adapters.md` when wiring hooks in Codex or Claude Code.
