# AGENTS.md — Tab Out Session AI Agent Development Guide & Memory

This file serves as the primary instructions, development rules, and persistent cross-conversation memory for AI Agents (**Google Antigravity**, **Claude Code**, **Cursor**, **Windsurf**, or **Codex**) when building, refactoring, or maintaining **Tab Out Session**.

---

## 🎯 Document Purpose & Core Principles

1. **Single Source of Truth**: Consolidate developer environment rules, release workflow specifications, and persistent cross-conversation memory in this single document.
2. **Internal Developer Guidance**: Provide clear architectural and execution rules for AI Agents assisting with codebase development.
3. **Persistent Memory Log**: Preserve implemented feature details, architectural facts, user preferences, and solved edge-cases across conversation resets or context truncations.
4. **No External User Onboarding**: Users install the extension directly by downloading pre-compiled ZIP bundles from [GitHub Releases](https://github.com/myg321/tab-out-session/releases/latest) and loading unpacked in `chrome://extensions`.

---

## 📋 Rules & Development Specifications

### 1. Mandatory Development & Environment Rules
- **Node.js Management**: ALWAYS use `fnm` to manage Node.js versions (e.g. `eval "$(fnm env --use-on-cd)"`). Do NOT use `nvm` or manual global installations.
- **Package Manager**: ALWAYS use `pnpm` as the sole package manager (`pnpm install`, `pnpm build`, `pnpm dev`). Do NOT use `npm`, `yarn`, or `npx` (use `pnpm dlx` instead).
- **Workspace Isolation**: All active React code lives in `extension-react/`. NEVER modify or write code to the legacy `extension/` folder.

### 2. Release & Documentation Rules
- **Clean Release Tag Titles**: GitHub Release titles/names MUST NOT include the project prefix `"Tab Out Session"`. Only use the clean version tag (e.g., `v1.2.0`, `v1.3.0`) to prevent sidebar list truncation on GitHub.
- **Delta-Focused Release Notes**: Write release notes into `RELEASE_NOTES.md` at repository root. Focus strictly on incremental changes for the target version without repeating historical feature lists.
- **Synchronous README Updates**: Whenever a release introduces new user-facing features, `README.md`'s **Core Feature Highlights** section MUST be updated synchronously before cutting the release tag.
- **Strict README Formatting Consistency**: Always maintain existing section hierarchy, list indentation, typography, and emoji usage patterns in `README.md` (e.g., do not insert arbitrary emojis in top-level bullet titles if sibling items do not use them).
- **Standardized Release Notes Structure**: Use `🚀 What's New`, `🐛 Bug Fixes & Refinements`, and `📦 Installation` sections in `RELEASE_NOTES.md`.
- **Single Source Release File**: `release.yml` GitHub Actions workflow reads `body_path: RELEASE_NOTES.md` to publish exact release notes directly to GitHub Releases.

---

## 📐 Key Architecture & Technical Facts

- **Manifest Standard**: Chrome Manifest V3 (`chrome_url_overrides: { newtab: "newtab.html" }`).
- **Tech Stack**: React 18, TypeScript 5.2, Zustand 4.5, Vite 5.3, `@phosphor-icons/react`.
- **Storage & Cloud Sync**: Local storage via `chrome.storage.local`. Cloud synchronization communicates directly from browser to GitHub REST API (`tab-out-session-data.json`) via secret GitHub Gists and PAT tokens — zero external servers.
- **Favicon Handling**: Uses Chrome's native `chrome-extension://<id>/_favicon/?pageUrl=` API with offline Base64 Data URL caching in `chrome.storage.local`.
- **Build Output**: `extension-react/dist` containing `manifest.json`, `newtab.html`, `popup.html`, `serviceWorker.js`, and compiled `assets/`.

---

## 🧠 Persistent Cross-Conversation Memory Log

### 1. Open Tabs Section & Safety Controls
- **Header Actions**: Features `Save All` (`<BookmarkSimple size={13} />`) and `Close All` (`<X size={13} />`).
- **2-Step Close Confirmation**: `Close All` requires 2-step confirmation (`Confirm Close?` state) with a 3.5s auto-reset timer.
- **Pinned Tab Protection**: `Close All` MUST NEVER close pinned tabs (`t.pinned === true`), regardless of `settings.showPinnedTabs`.
- **PWA Desktop App Filtering & Protection**: 
  - Setting `hidePwaTabs?: boolean` in `Settings` (default `true`).
  - `loadTabs()` queries `chrome.windows.getAll()` and excludes tabs in standalone PWA app windows (`w.type === 'app'`, such as Google Calendar, Notion, Teams).
  - PWA desktop app windows are strictly protected from batch closure.
- **Domain Auto-Grouping**: Tabs are grouped automatically by domain, host, and port (supporting full `localhost:PORT` distinction for developers).

### 2. Session Management & State Engine
- **3-State Adaptive Accordion**: Session cards feature Collapsed (1-line header), Partial (top 3 tabs preview), and Full Expanded states with persistent UI state per session card.
- **Earth & Gem Color Tagging**: Supports 8 curated color themes (`clay`, `sage`, `slate`, `terra`, `rose`, `moss`, `indigo`, `sand`).
- **Trash Retention & Expiry**: Deleted sessions move to `trash[]` with a 30-day auto-expiry timer (`expiresAt`) and 1-click restore functionality.
- **Universal Drag-and-Drop**: Supports native drag-and-drop reordering for Session cards, intra-Session links, Save for Later checklist items, and Quick Sites tiles.

### 3. Extension Toolbar Popup
- **Instant Webpage Parking**: Extension toolbar popup (`popup.html`) allows 1-click parking of active browser tabs into any existing Session, Save for Later, or a newly created Session.
- **Real-Time Storage Sync**: Updates `chrome.storage.local` immediately on save for instant dashboard reflection across all Chrome windows.

### 4. Encrypted Cloud Sync Engine
- **Direct GitHub REST Integration**: Communicates directly with GitHub API (`https://api.github.com/gists`) using Personal Access Tokens (PAT).
- **Save for Later Timestamp Sync**: `SaveForLaterTab` includes an `updatedAt?: number` timestamp to ensure unchecking completed items syncs correctly to cloud Gist without being overridden by remote state.
- **Token Copy Feature**: Copy Token button with clipboard copy and toast feedback resides inside `SyncModal.tsx` status card — NOT in topbar dropdown.

### 5. UI Design System & Topbar
- **Year Progress Topbar**: Inherited from Tab Out Mission, displaying real-time D-O-Y timeline progress percentage (`YEAR PROGRESS: XX.X%`).
- **Typography & Theme**: Fraunces serif display clock paired with Inter sans-serif body, offering automatic Light/Dark mode adaptation based on system OS.
- **Unified Phosphor Icons**: All action buttons use Phosphor Icons (`<BookmarkSimple />`, `<X />`, `<Trash />`, `<Plus />`, `<Copy />`, `<Check />`).
