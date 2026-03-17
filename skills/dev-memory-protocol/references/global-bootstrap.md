# Global Bootstrap

Use this guide after installing the skill into Codex when you want future project conversations to auto-bootstrap project memory.

## Goal

Let the installed skill manage one global bootstrap block in `~/.codex/AGENTS.md`.

That global block should:

- Detect project roots
- Create `.ai/` when a project has not been initialized yet
- Read baseline memory when `.ai/` already exists
- Prefer recall before implementation work

## Enable

Run:

```bash
node "<skill-path>/scripts/install-global.mjs"
```

## Enable And Initialize Current Project

If you want one immediate follow-up step after skill installation, run:

```bash
node "<skill-path>/scripts/post-install.mjs" --project .
```

This will:

- enable the managed global bootstrap block
- initialize `.ai/` for the current directory if it already looks like a project root
- let you use the scripts immediately without waiting for Codex to reload the installed skill registry

## Disable

Run:

```bash
node "<skill-path>/scripts/uninstall-global.mjs"
```

## Notes

- This is separate from project initialization.
- Installing the skill into Codex does not automatically enable the global bootstrap block.
- The global bootstrap block should be append-only and must not overwrite existing global rules outside the managed block.
