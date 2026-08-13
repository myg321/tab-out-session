---
name: git-commit-push
description: >-
  Automated Git commit and push workflow for Tab Out Session. Use when invoked via /git-commit-push or when asking to commit and push code changes to GitHub. Supports custom user directives and parameters.
---

# Tab Out Session Git Commit and Push Skill

This skill defines the safe, project-tailored, automated workflow for validating, committing, and pushing code changes for **Tab Out Session**.

## Action Directive

When invoked (via `/git-commit-push` or user request), the Agent MUST execute the following pipeline while honoring any custom user directives:

### Step 1 — Clean Working Tree Check
Run `git status -s`. If there are no modified or untracked files, inform the user: *"No code changes detected in the workspace. Nothing to commit."* and exit safely.

### Step 2 — Smart Branch Safety Check
Inspect git branches (`git branch -a`):
- **Single Branch Setup** (e.g. only `main` exists): Do NOT ask the user. Proceed automatically on the active branch.
- **Multiple Branches Setup** (e.g. `main`, `dev`, `feature/xyz` exist): Stop and ask user confirmation: *"Multiple branches detected. You are currently on branch `[active-branch-name]`. Confirm committing and pushing to this branch?"*

### Step 3 — Secrets & Safety Safeguard
Inspect modified file paths in `git status -s`:
- If changes contain sensitive files (`.env`, `*.pem`, `*.key`, `id_rsa`, `*.log`, or credentials), pause and warn the user: *"Detected potentially sensitive file `[filename]` in changes. Please confirm before staging."*

### Step 4 — Pre-commit Build Verification
Run `cd extension-react && pnpm build` to verify zero TypeScript compilation or Vite bundler errors before committing. If the build fails, stop and report errors immediately.

### Step 5 — Custom Directives & Overrides Handling
If the user provides any custom instructions alongside the invocation (e.g., amending into previous commit, excluding/including specific files, custom commit messages, custom push options), the Agent MUST strictly respect and apply those custom requirements during the git operations rather than ignoring them.

If no custom instructions are specified, proceed automatically with the standard flow below.

### Step 6 — Standard Conventional Commit & Push

1. Stage target modified files (`git add .` or custom selection).
2. Commit using auto-generated Conventional Commit format (`feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`).
3. Push to active branch (`git push origin <active-branch-name>`).

### Step 7 — Summary Output
Output a short summary card stating:
- Active Branch
- Commit Hash & Message
- Push Status
