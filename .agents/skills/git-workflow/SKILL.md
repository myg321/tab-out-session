---
name: git-workflow
description: >-
  Standard Git commit and push workflow for Tab Out Session. Use when the user asks to check, commit, or push code changes to GitHub.
---

# Tab Out Session Git Workflow Runbook

This skill defines the step-by-step procedure for verifying, committing, and pushing code changes for **Tab Out Session**.

## Pre-commit Verification Checklist

1. Run `git status -s` to inspect modified and untracked files.
2. Run `cd extension-react && pnpm build` to verify zero compilation or TypeScript errors.
3. Ensure no temporary test files or local secrets are accidentally staged.

## Conventional Commit Format

All commit messages MUST follow the standard Conventional Commits prefix:

- `feat:` New user-facing feature or capability
- `fix:` Bug fix or issue resolution
- `refactor:` Code refactoring without functionality changes
- `style:` Formatting, CSS polish, or UI adjustments
- `docs:` Documentation, README, or AGENTS.md updates
- `chore:` Maintenance, build scripts, or dependency updates

Examples:
- `feat(sessions): add 30-day trash retention auto-expiry`
- `fix(tabs): exclude PWA desktop app windows from batch close`
- `docs(agents): update repository map and skill references`

## Execution Steps

```bash
# 1. Verify build
cd extension-react && pnpm build

# 2. Stage target files
git add <target-files>

# 3. Commit with Conventional Commits message
git commit -m "<type>(<scope>): <description>"

# 4. Push to remote main
git push origin main
```
