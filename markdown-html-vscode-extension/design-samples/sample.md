---
name: source-first-env-reconstruction
description: Build setup from source manifests before relying on generated state.
tools:
  - read
  - search
  - execute
references:
  - references/setup.md
  - references/troubleshooting.md
owner: local-team
updated: 2026-05-22
---

# Source-first Env Reconstruction

Use this skill when a workspace must be reconstructed from source files and public manifests rather than local generated state.

> Keep the generated state disposable. The source files should explain how to rebuild it.

## When to Use

- A project has package manifests, lockfiles, or build settings but no reliable local environment.
- A prior setup works on one machine but fails on another.
- A generated directory exists but should not be treated as the source of truth.

## Workflow

1. Read the source manifests first.
2. Identify the smallest repeatable setup command.
3. Rebuild generated files from source.
4. Run the focused verification command.
5. Record any remaining manual step.

## Output Rules

| Area | Rule | Example |
| --- | --- | --- |
| Dependencies | Use the manifest, not local cache state. | `package-lock.json` |
| Generated files | Recreate from source when possible. | `npm run build` |
| References | Keep links as file references. | `references/setup.md` |

## Command Example

```bash
npm install
npm test
npm run package:extension
```

## Notes

Short notes should still render as clean reading pages. If metadata is absent, the metadata panel should not appear.
