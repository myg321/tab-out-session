---
name: install-extension
description: >-
  Tab Out Session Chrome Extension automated installation runbook. Use when a user asks to clone, build, or install this extension into Chrome.
---

# Tab Out Session Extension Installation Runbook

When a user asks you to "install this extension", "build and load tab-out-session", or "set up tab-out-session", follow the automated workflow below.

## Security Boundaries

Google Chrome prohibits CLI tools from programmatically interacting with `chrome://extensions` toggles or file pickers. Your role as an Agent is to:

1. Clone repository and install dependencies.
2. Run `pnpm build` in `extension-react/`.
3. Copy the absolute path of `extension-react/dist` to the system clipboard.
4. Launch `chrome://extensions` in the default browser.
5. Provide clear guidance for the final manual clicks.

## Product Overview

Tab Out Session is an editorial Chrome New Tab page extension combining temporal year progress awareness with domain-level tab control, color-coded session management, and encrypted GitHub Gist cloud synchronization.

Pre-built ZIP bundles are available directly on GitHub Releases for non-developer users who do not require CLI compilation.

## Step 1 — Clone and Build

Execute shell commands in the workspace:

```bash
git clone https://github.com/myg321/tab-out-session.git
cd tab-out-session/extension-react
pnpm install && pnpm build
```

If `pnpm` is not available, fall back to `npm install && npm run build`.

## Step 2 — Copy Path and Open Extension Manager

### Copy absolute build path

- macOS: `cd extension-react/dist && pwd | pbcopy`
- Linux: `cd extension-react/dist && pwd | xclip -selection clipboard 2>/dev/null || echo "Dist path: $(pwd)"`
- Windows (PowerShell): `Set-Clipboard -Value (Get-Item extension-react\dist).FullName`

### Open Chrome Extensions Manager

- macOS: `open "chrome://extensions"`
- Linux: `google-chrome "chrome://extensions"`
- Windows: `start chrome "chrome://extensions"`

### Guide User Manual Clicks

Recite remaining setup instructions:

1. In `chrome://extensions`, toggle **Developer mode** in the top-right corner.
2. Click **Load unpacked** in the top-left toolbar.
3. When the file picker opens, press **Cmd + Shift + G** on macOS (or **Ctrl + L** on Windows/Linux), paste the clipboard path, and press Enter.
4. Click **Select / Open** to load Tab Out Session.
5. Open a new tab (**Cmd + T**) to launch the dashboard.

## Step 3 — Post-Install Feature Tour

Summarize primary feature controls:

1. **Top Bar**: Year progress percentage bar, Fraunces serif clock, and GitHub Gist sync badge.
2. **Open Tabs**: Domain-grouped active tabs with batch Save, Deduplicate, and Close controls.
3. **Sessions**: Color-tagged session cards with 3-state adaptive accordions and 30-day Trash bin.
4. **Save for Later**: Reading checklist with fountain pen strikethrough animations.
