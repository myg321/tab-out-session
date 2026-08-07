# Release Notes Specification Rule

This rule defines the mandatory guidelines and format for writing GitHub Release Notes for **Tab Out Session**.

---

## 🎯 Rule Guidelines

1. **Delta-Focused Only (No Historical Feature Repetition)**:
   - Incremental version releases (`v1.2.0`, `v1.3.0`, etc.) **MUST NOT** repeat the all-time core feature list from previous releases.
   - Focus exclusively on incremental changes (new features, bug fixes, UI polish, or CI improvements) introduced in the current tag/version.

2. **Standardized Section Categorization**:
   - **Headline Quote**: A 1-sentence summary highlight of the release's primary value proposition.
   - **🚀 What's New**: Bullet points describing new capabilities added in this tag.
   - **🐛 Bug Fixes & Refinements**: Bullet points describing fixes, performance enhancements, or structural improvements.
   - **📦 Installation**: A concise 1-sentence instruction pointing users to download the `.zip` from the Release Assets.

3. **Single Source of Truth**:
   - Release notes content MUST be maintained in `RELEASE_NOTES.md` at the repository root.
   - GitHub Actions workflow (`.github/workflows/release.yml`) uses `body_path: RELEASE_NOTES.md` to publish the exact markdown text to GitHub Releases.

---

## 📝 Release Notes Template

When preparing a new release, format `RELEASE_NOTES.md` according to the following template:

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
