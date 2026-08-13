---
name: release-flow
description: >-
  Tab Out Session automated release workflow for pre-flight verification, README feature updates, RELEASE_NOTES.md generation, and GitHub tag publishing. Use when invoked via /release-flow or when the user mentions packaging a release, releasing a new version, or preparing a version tag.
---

# Tab Out Session Release Flow Runbook

This skill defines the fully automated procedure for validating, updating documentation, generating product-manager-curated release notes, and publishing GitHub Releases for **Tab Out Session**.

## Automated Action Directive

When this skill is invoked (via `/release-flow` or user request to package/release a version), the Agent MUST execute the following pipeline end-to-end:

### Step 1 — Automated Pre-flight Verification
1. Run `git status -s` to inspect working tree status.
2. Run `cd extension-react && pnpm build` to verify zero TypeScript or Vite compilation errors before packaging.

### Step 2 — Product Manager Perspective & User-Centric Wording
When generating release notes from recent commit logs, adopt a Product Manager perspective to frame updates around **user-perceivable value**:
- **Priority 1 (Major User Capabilities & Interactions)**: Major user flow breakthroughs (e.g. cross-sectional drag-and-drop between Save for Later and Sessions), core feature additions, or sync database engines. MUST be ordered first under `What's New`.
- **Priority 2 (Secondary Features & User-Facing Polish)**: Feature options, popup quick actions, or secondary workflow controls. Placed after major features.
- **Filter Out Trivial Internal Edits**: Omit purely internal code refactors, build script tweaks, or trivial non-user-facing commits.
- **Ignore Agent & Internal Documentation Commits**: Commits modifying `AGENTS.md`, `AGENTS.local.md`, `DESIGN.md`, `.agents/` folder, or `.agents/skills/` runbooks (e.g. commits with `docs(agents):` or `chore(agents):`) MUST be completely ignored. They pertain to internal AI Agent guidelines and developer runbooks, NOT user-facing features or bug fixes.
- **No Engineering Jargon or Pixel Measurements**: Release Notes are written for end-users, NOT developers. MUST NOT include internal engineering terms, exact pixel measurements (e.g. `680px`, `15px / weight 600`), CSS class names, code variable names, or technical DOM event terms. Frame UI changes by user experience improvements (e.g. use *"Expanded Two-Column Settings Layout"* instead of *"680px Two-Column Settings Layout"*).

### Step 3 — Strict Emoji & Formatting Rules
- **Header Emojis Only**: Emojis are ONLY permitted as section header prefixes (`### 🚀 What's New`, `### 🐛 Bug Fixes & Refinements`, `### 📦 Installation`).
- **No Bullet Emojis**: Bullet items MUST NOT contain decorative emojis. Use clean `- **[Title]**: Description` list format.

### Step 4 — README Feature Filtering & Inclusion Boundaries
When checking whether recent commits warrant updates to `README.md`'s **Features in Detail** section, strictly enforce the following Product Manager boundaries:

1. **Only Genuine New Capabilities Deserve Standalone Bullets**:
   - Only genuinely new functional capabilities (e.g. Multi-Gist backup database management, bi-directional cross-sectional drag & drop) warrant a standalone new feature bullet point in `README.md`.

2. **Strictly Ban UI-Only Polish as Standalone Features**:
   - Pure UI layout or visual style changes (e.g. modal column layouts, spacing tweaks) MUST NOT be listed as standalone feature items in `README.md`. UI visual tweaks are not new functional capabilities.

3. **Strictly Ban Minor Micro-Hints / Tooltips as Standalone Features**:
   - Minor micro-interactions or subtle UX hints (e.g. session title hover tooltips) are minor humanized touches, NOT features. They MUST NOT be elevated into standalone feature bullets. If relevant, seamlessly blend them into existing main feature descriptions or omit them.

4. **No Forced "Commit-to-Feature" Mapping**:
   - Do NOT mechanically map every single commit log into a README entry. Filter aggressively to keep `README.md` strictly clean, high-density, and focused on genuine user capabilities.

### Step 5 — Curated RELEASE_NOTES.md Generation
1. Summarize prioritized delta changes introduced between the last tag and current `HEAD` (excluding agent/doc commits).
2. Format and write the release summary into `RELEASE_NOTES.md` at the repository root using the official template below.
3. Ensure release notes are strictly delta-focused and do not repeat historical feature lists.

### Step 6 — Version Tagging & Automated GitHub Release Publishing
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

When updating `RELEASE_NOTES.md`, format content according to this exact template:

```markdown
## Tab Out Session vX.Y.Z

> **Version Highlight**: [1-sentence summary of the main feature or fix in this release]

### 🚀 What's New

- **[Major Feature Title]**: [Description of core breakthrough feature added in this release]
- **[Secondary Feature Title]**: [Description of secondary feature or polish]

### 🐛 Bug Fixes & Refinements

- **[Fix Title]**: [Description of bug fix or refinement made in this release]

---

### 📦 Installation

Download `tab-out-session-vX.Y.Z.zip` from **Assets** below, extract, and load into Chrome (`chrome://extensions`).
```
