---
name: release-flow
description: >-
  Tab Out Session automated release workflow for pre-flight verification, README feature updates, RELEASE_NOTES.md generation, and GitHub tag publishing. Use when invoked via /release-flow or when the user mentions packaging a release, releasing a new version, or preparing a version tag.
---

# Tab Out Session Release Flow Runbook

This skill defines the fully automated procedure for validating, updating documentation, generating release notes, and publishing GitHub Releases for **Tab Out Session**.

## Automated Action Directive

When this skill is invoked (via `/release-flow` or user request to package/release a version), the Agent MUST execute the following pipeline end-to-end:

### Step 1 — Automated Pre-flight Verification
1. Run `git status -s` to inspect working tree status.
2. Run `cd extension-react && pnpm build` to verify zero TypeScript or Vite compilation errors before packaging.

### Step 2 — Incremental README Features Check
1. Inspect commit logs since the previous version tag (`git log <last-tag>..HEAD --oneline`).
2. Identify if any new user-facing capabilities (`feat:`) were added since the last release.
3. If new features exist and are missing from `README.md`, check and update the **Features in Detail** section in `README.md` synchronously before cutting the release.

### Step 3 — Curated RELEASE_NOTES.md Generation
1. Summarize delta changes introduced between the last tag and current `HEAD`.
2. Format and write the release summary into `RELEASE_NOTES.md` at the repository root using the official template below.
3. Ensure release notes are strictly delta-focused and do not repeat historical feature lists.

### Step 4 — Version Tagging & Automated GitHub Release Publishing
1. Determine the target semantic version tag (e.g., `v1.3.0`). Version tags MUST NOT include the project name prefix.
2. Commit release documentation:
   ```bash
   git add RELEASE_NOTES.md README.md
   git commit -m "chore(release): prepare release vX.Y.Z"
   git push origin main
   ```
3. Create and push the version tag:
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
4. Verify that `.github/workflows/release.yml` triggers automatically on GitHub to build and create the release.

---

## Release Notes Template

When updating `RELEASE_NOTES.md`, format content according to this template:

```markdown
## Tab Out Session vX.Y.Z

> **Highlight**: [1-sentence summary of the main feature or fix in this release]

### 🚀 What's New
- **[Feature Title]**: [Description of new feature added in this release]

### 🐛 Bug Fixes & Refinements
- **[Fix Title]**: [Description of bug fix or improvement made in this release]

---

### 📦 Installation
Download `tab-out-session-vX.Y.Z.zip` from **Assets** below, extract, and load into Chrome (`chrome://extensions`).
```
