# AGENTS.md — Tab Out Session AI Agent Development Guide & Memory

This file serves as the primary instructions and persistent cross-conversation memory for AI Agents (**Google Antigravity**, **Claude Code**, **Cursor**, **Windsurf**, or **Codex**) when building, refactoring, or maintaining **Tab Out Session**.

---

## 🎯 Document Purpose & Core Principles

1. **Internal Developer Guidance**: Provide clear rules and architectural specifications for AI Agents assisting with codebase development.
2. **Persistent Cross-Conversation Memory**: Preserve core product decisions, user preferences, solved edge-cases, and historical context across conversation resets or context truncations.
3. **No External User Onboarding**: Users install the extension directly by downloading pre-compiled ZIP bundles from [GitHub Releases](https://github.com/myg321/tab-out-session/releases/latest) and loading unpacked in `chrome://extensions`.

---

## 🛠️ Mandatory Development Rules & Environment

1. **Node.js Management**: ALWAYS use `fnm` to manage Node.js versions (e.g. `eval "$(fnm env --use-on-cd)"`). Do NOT use `nvm` or manual global installations.
2. **Package Manager**: ALWAYS use `pnpm` as the sole package manager (`pnpm install`, `pnpm build`, `pnpm dev`). Do NOT use `npm`, `yarn`, or `npx` (use `pnpm dlx` instead).
3. **Workspace Isolation**: All active React code lives in `extension-react/`. NEVER modify or write code to the legacy `extension/` folder.
4. **Git Hygiene & Local Isolation**: AI Agent local customization rules and scratchpad files in `.agents/` MUST remain strictly local and ignored in `.gitignore`.

---

## 📐 Key Architecture & Technical Facts

- **Manifest Standard**: Chrome Manifest V3 (`chrome_url_overrides: { newtab: "newtab.html" }`).
- **Tech Stack**: React 18, TypeScript 5.2, Zustand 4.5, Vite 5.3, `@phosphor-icons/react`.
- **Storage & Cloud Sync**: Local storage via `chrome.storage.local`. Cloud synchronization communicates directly from browser to GitHub REST API (`tab-out-session-data.json`) via GitHub Gists and PAT tokens — zero external servers.
- **Favicon Handling**: Uses Chrome's native `chrome-extension://<id>/_favicon/?pageUrl=` API with offline Base64 Data URL caching in `chrome.storage.local`.

---

## 📝 Release & Documentation Rules

1. **Clean Release Tag Titles**: GitHub Release titles/names MUST NOT include the project prefix `"Tab Out Session"`. Only use the clean version tag (e.g., `v1.2.0`, `v1.3.0`) to avoid sidebar truncation.
2. **Delta-Focused Release Notes**: Write release notes into `RELEASE_NOTES.md` at root. Focus strictly on incremental changes for the target version without repeating historical feature lists.
3. **Synchronous README Updates**: Whenever a release introduces new user-facing features, `README.md`'s **Core Feature Highlights** section MUST be updated synchronously before cutting the release tag.
4. **Strict README Formatting Consistency**: Always maintain existing section hierarchy, list indentation, typography, and emoji usage patterns in `README.md` (e.g., do not add ad-hoc emojis to top-level bullet titles if sibling items do not use them).

---

## 🧠 Persistent Cross-Conversation Memory & Decisions Log

### 1. Open Tabs Section & Safety Controls
- **Header Actions**: Features `Save All` (`<BookmarkSimple size={13} />`) and `Close All` (`<X size={13} />`).
- **2-Step Close Confirmation**: `Close All` requires 2-step confirmation (`Confirm Close?` state) with a 3.5s auto-reset timer.
- **Pinned Tab Protection**: `Close All` MUST NEVER close pinned tabs (`t.pinned === true`), regardless of `settings.showPinnedTabs`.
- **PWA Desktop App Filtering & Protection**: 
  - Added `hidePwaTabs?: boolean` in `Settings` (default `true`).
  - `loadTabs()` queries `chrome.windows.getAll()` and excludes tabs in standalone PWA app windows (`w.type === 'app'`, such as Google Calendar, Notion, Teams).
  - PWA desktop app windows are strictly protected from batch closure.

### 2. Session & Save for Later State Engine
- **Save for Later Timestamp Sync**: `SaveForLaterTab` includes an `updatedAt?: number` timestamp to ensure unchecking completed items syncs correctly to cloud Gist without being overridden by remote state.
- **3-State Adaptive Accordion**: Sessions feature Collapsed, Partial (top 3 tabs), and Full Expanded states with persistent UI state.
- **Universal Drag-and-Drop**: Supports native drag-and-drop reordering for Session cards, intra-Session links, Save for Later checklist items, and Quick Sites tiles.

### 3. Sync & Modal Design
- **Token Copy Feature**: Token copy button with clipboard copy and toast feedback resides inside `SyncModal.tsx` status card — NOT in the topbar `SyncBadge` dropdown menu.
- **Pre-built Release Packaging**: `.github/workflows/release.yml` zips `extension-react/dist` contents directly so `manifest.json` sits at zip root for 1-click loading unpacked.
