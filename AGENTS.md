# AGENTS.md — AI Agent Installation & Development Guide

This file provides instructions for AI Coding Agents (such as **Google Antigravity**, **Claude Code**, **Cursor**, **Windsurf**, or **Codex**) when assisting users with installing, building, or extending **Tab Out Session**.

---

## 🤖 For AI Agents: Quick Installation Workflow

When a user asks you to *"install this extension"* or *"set up tab-out-session"*, follow the automated workflow below.

> ⚠️ **Note on Chrome Extension Security**
> Google Chrome prohibits external software or CLI tools from programmatically interacting with `chrome://extensions` toggles or file pickers. Your role as an agent is to:
> - ✅ Clone the repository and install dependencies
> - ✅ Run `pnpm build` (or `npm run build`) to produce the `extension-react/dist` bundle
> - ✅ Copy the absolute path of `extension-react/dist` to the user's system clipboard
> - ✅ Open `chrome://extensions` in the default browser
> - ✅ Clearly guide the user through the final 3 manual clicks

---

### Step 0 — Introduce Product & Value

Before performing terminal commands, give the user a quick 1-sentence overview:

> **Tab Out Session** is an editorial Chrome New Tab page extension combining temporal year progress awareness with domain-level tab control, color-coded session management, and encrypted GitHub Gist cloud synchronization.

---

### Step 1 — Clone Repository & Build Dist Bundle

Execute the following shell commands in the workspace:

```bash
# Clone the repository
git clone https://github.com/myg321/tab-out-session.git
cd tab-out-session/extension-react

# Install dependencies and build extension bundle
pnpm install && pnpm build
```

*(If `pnpm` is not available, fall back to `npm install && npm run build`)*

---

### Step 2 — Prepare Chrome Loading & Copy Path

**Sub-step A: Copy the absolute build path to clipboard**

- **macOS**:
  ```bash
  cd extension-react/dist && pwd | pbcopy && echo "✓ Extension dist path copied to clipboard!"
  ```
- **Linux**:
  ```bash
  cd extension-react/dist && pwd | xclip -selection clipboard 2>/dev/null || echo "Dist path: $(pwd)"
  ```
- **Windows (PowerShell)**:
  ```powershell
  Set-Clipboard -Value (Get-Item extension-react\dist).FullName
  ```

**Sub-step B: Open Chrome Extensions Manager Page**

- **macOS**: `open "chrome://extensions"`
- **Linux**: `google-chrome "chrome://extensions"`
- **Windows**: `start chrome "chrome://extensions"`

**Sub-step C: Output Clear User Instructions**

Recite the remaining 4 manual clicks to the user clearly:

> **Path copied to your clipboard!** Complete the final setup in Chrome:
>
> 1. In `chrome://extensions`, toggle **Developer mode** (top-right corner).
> 2. Click the **Load unpacked** button (top-left toolbar).
> 3. When the system file picker opens, press **`Cmd + Shift + G`** on macOS (`Ctrl + L` on Windows/Linux) to bring up the path input box, paste (`Cmd + V` / `Ctrl + V`), and press Enter.
> 4. Click **Select / Open** to load **Tab Out Session**.
> 5. Open a **New Tab** (`Cmd + T`) to launch your new dashboard!

**Sub-step D (Fallback Helper)**: Open Finder / Explorer to the `dist` directory so the user can drag-and-drop if desired:

- **macOS**: `open extension-react/dist`
- **Windows**: `explorer extension-react\dist`

---

### Step 3 — Feature Walkthrough & Verification

After the user loads the extension, summarize the primary feature controls:

1. **Top Bar**: Year progress percentage bar, Fraunces serif clock, and GitHub Gist sync status badge.
2. **Quick Sites Grid**: Drag-and-drop bookmark tiles with custom canvas cropper (squircle/circle tile shapes).
3. **Open Tabs Section**: Domain-grouped active tabs with batch "Save Group", "Deduplicate", and "Close" buttons.
4. **Sessions Section**: Color-tagged session cards with 3-state adaptive accordions and 30-day Trash bin.
5. **Save for Later**: Reading checklist with handwritten fountain pen strikethrough animations.

---

## 🛠️ Key Technical Facts for Agents

- **Manifest Version**: Chrome Manifest V3 (`chrome_url_overrides: { newtab: "newtab.html" }`).
- **Tech Stack**: React 18, TypeScript 5.2, Zustand 4.5, Vite 5.3, Phosphor Icons.
- **Icon Permission**: Uses Chrome's native `chrome-extension://<id>/_favicon/?pageUrl=` API with offline Base64 `chrome.storage.local` caching.
- **Cloud Sync**: Direct browser REST API calls to GitHub Gists (`tab-out-session-data.json`) using Personal Access Tokens — no external servers.
- **Updating**: Run `git pull && cd extension-react && pnpm build`, then click the reload button in `chrome://extensions`.
- **Original Lineage**: Forked from [Tab Out Mission](https://github.com/Logan-tree/tab-out-mission), inspired by Zara's [Tab Out](https://github.com/zarazhangrui/tab-out).
