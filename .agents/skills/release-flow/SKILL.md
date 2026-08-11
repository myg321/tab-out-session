---
name: release-flow
description: >-
  Tab Out Session release runbook for version tag naming, RELEASE_NOTES.md updates, and README.md feature updates. Use when preparing or executing a release.
---

# Tab Out Session Release Flow Runbook

This skill defines the mandatory guidelines, pre-flight checks, and publishing workflow for preparing GitHub Releases for **Tab Out Session**.

## Distribution Channels

| Channel | What Ships | Trigger | Automation |
|---|---|---|---|
| GitHub stable release | Source bundle + assets | Push a version tag (`v1.2.0`) | `release.yml` builds and creates the release; `RELEASE_NOTES.md` provides body content |
| GitHub Releases ZIP | Pre-compiled extension ZIP | Manual release asset upload | Attached to GitHub Release for non-developer direct loading |

## Mandatory Release Guidelines

1. **Clean Version Tag Titles (No Project Prefix)**:
   - Release titles/names MUST NOT include the project prefix `"Tab Out Session"`.
   - Use clean version tags strictly (e.g., `v1.2.0`, `v1.3.0`) so sidebar release lists on GitHub never get truncated.

2. **Delta-Focused Only (No Historical Feature Repetition)**:
   - Incremental version release notes MUST NOT repeat the all-time core feature list from previous releases.
   - Focus exclusively on incremental changes (new features, bug fixes, UI polish, or CI improvements) introduced in the current tag/version.

3. **Synchronous README Feature Updates**:
   - Whenever a new version introduces user-facing features or capabilities, `README.md`'s **Core Feature Highlights** section MUST be updated synchronously before cutting the release.
   - **Strict Formatting Consistency**: Adhere strictly to existing typography, list indentation, and emoji patterns.

4. **Single Source of Truth**:
   - Release notes content MUST be maintained in `RELEASE_NOTES.md` at the repository root.
   - GitHub Actions workflow (`.github/workflows/release.yml`) uses `body_path: RELEASE_NOTES.md` to publish exact markdown text directly to GitHub Releases.

## Pre-flight Checklist

1. `git status -s` is clean or only contains staged release work.
2. `cd extension-react && pnpm build` exits with code 0 without TypeScript or Vite errors.
3. `RELEASE_NOTES.md` is updated at repository root following the template below.
4. `README.md` Core Feature Highlights section is updated if user-facing capabilities changed.

## Tag and Publish

```bash
git add RELEASE_NOTES.md README.md
git commit -m "chore(release): prepare release vX.Y.Z"
git push origin main
git tag vX.Y.Z
git push origin vX.Y.Z
```

Verify that `.github/workflows/release.yml` completes successfully and creates the GitHub Release with `RELEASE_NOTES.md` content.

## Release Notes Template

When preparing a release, format `RELEASE_NOTES.md` according to this template:

```markdown
## 🌿 Tab Out Session vX.Y.Z

> 🚀 **Version Highlight**: [1-sentence summary of the main feature or fix in this release]

### 🚀 What's New
- 📱 **[Feature Title]**: [Description of new feature added in this release]

### 🐛 Bug Fixes & Refinements
- 📦 **[Fix Title]**: [Description of bug fix or improvement made in this release]

---

### 📦 Installation
Download `tab-out-session-vX.Y.Z.zip` from **Assets** below, extract, and load into Chrome (`chrome://extensions`).
```
