# Tab Out Session Agent Guide

This file is the shared source of truth for any AI agent working on this repo (Google Antigravity, Codex, Cursor, etc.). Put machine-specific or personal overrides in `AGENTS.local.md`; it is gitignored.

## Project

Tab Out Session is an editorial Chrome New Tab page extension combining temporal year progress awareness with domain-level tab control, color-coded session management, and encrypted GitHub Gist cloud synchronization.

## Product Direction

Tab Out Session is a privacy-first, editorial Chrome New Tab dashboard. Its core job is to give users high-density tab awareness, rapid session parking, reading checklist tracking, and zero-server encrypted cloud sync. It is not a tab hoarding archive, broad bookmark browser, or server-backed web service.

### What Tab Out Session Should Do

- Keep tab management fast, predictable, and local-first using `chrome.storage.local`.
- Provide domain-level auto-grouping with full port distinction (e.g. distinguishing `localhost:3000` vs `localhost:8080`).
- Protect user flow with two-step confirmations for destructive actions like Close All.
- Offer 3-state adaptive accordions (Collapsed, Partial, Full) for session cards with color-tagging.
- Support direct GitHub REST API synchronization to user Gists using Personal Access Tokens without intermediate servers.

### What Tab Out Session Should Not Do

- Do not send tab URLs, session data, or credentials to any third-party backend or tracking service.
- Do not close pinned tabs during batch operations regardless of visibility settings.
- Do not touch or close standalone PWA desktop app windows (such as Google Calendar, Notion, Teams).
- Do not introduce arbitrary dependencies or CSS frameworks when Vite, React 18, and Vanilla CSS suffice.

### Product Decision Filter

Before accepting a new feature or UX change, answer these questions:

1. Does it respect user privacy and operate 100% locally or via direct GitHub Gist sync?
2. Is it safe by default, preserving pinned tabs and desktop PWA windows during batch operations?
3. Does it adhere to the editorial typography system (Fraunces clock + Inter body) without adding visual noise?
4. Would this feature be better as an optional user setting rather than an enforced default?

## Repository Map

- `AGENTS.md` is the cross-agent source of truth.
- `AGENTS.local.md` contains gitignored personal or machine-specific rules and prompt overrides.
- `.agents/skills/` is the canonical home for project skills:
  - `.agents/skills/install-extension/SKILL.md`: Runbook for automated Chrome extension setup, compilation, and path copy.
  - `.agents/skills/release-flow/SKILL.md`: Runbook for version tag conventions, `RELEASE_NOTES.md` formatting, and release verification.
  - `.agents/skills/git-workflow/SKILL.md`: Runbook for pre-commit build verification, Conventional Commits format, and pushing changes.
- `extension-react/`: Active React 18 / TypeScript 5 / Vite codebase and UI components.
- `RELEASE_NOTES.md`: Target release notes consumed by GitHub Actions `release.yml`.

## Commands

```bash
eval "$(fnm env --use-on-cd)"
cd extension-react
pnpm install
pnpm dev
pnpm build
```

## Critical Safety Rules

- ALWAYS use `fnm` for Node.js management and `pnpm` as the sole package manager (`pnpm install`, `pnpm build`). Never use `npm`, `yarn`, or `npx` (use `pnpm dlx` instead).
- All active React code lives in `extension-react/`. NEVER modify or write code to the legacy `extension/` folder.
- ALWAYS run `cd extension-react && pnpm build` to verify zero compilation errors before running `git commit`.
- ALWAYS follow Conventional Commits format (`feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`) for commit messages.
- `Close All` MUST NEVER close pinned tabs (`t.pinned === true`), regardless of `settings.showPinnedTabs`.
- `loadTabs()` MUST query `chrome.windows.getAll()` and exclude tabs in standalone PWA app windows (`w.type === 'app'`). PWA desktop app windows are strictly protected from batch closure.
- Favicon handling MUST use Chrome's native `chrome-extension://<id>/_favicon/?pageUrl=` API with offline Base64 Data URL caching in `chrome.storage.local`.
- Cloud synchronization MUST communicate directly from browser to GitHub REST API (`tab-out-session-data.json`) via secret Gists and PAT tokens with zero external servers. Single-Gist auto-discovery remains active by default. Advanced Multi-Gist mode requires explicit consent via `settings.allowMultiGist` toggle with warning modal before enabling.

## Mandatory Agent Collaboration Workflow

For any feature request, UI enhancement, or bug fix, agents MUST strictly follow this 3-phase collaborative workflow. All subagents MUST read the live contract from `AGENTS.md` and `DESIGN.md` at runtime instead of copying frozen rule snapshots.

### Subagent Roles & Responsibilities

- Product Manager Agent (PM Agent): Assesses feature proposals for product positioning (`AGENTS.md`), feasibility, trade-offs, and Chrome Extension API technical constraints. Does not dictate visual design rules.
- UI/UX Designer Agent (Designer Agent): Owns overall visual design, typography, layout alignment, and design system tokens (`DESIGN.md`). Produces exact visual & CSS/React modification specifications.
- Engineer Agent: Executes code implementation adhering strictly to PM/Designer specifications and performs build verification (`pnpm build`).

---

### Workflow Phases

1. Phase 1: Pre-Assessment & Specification. Delegate feature rationale and Chrome API feasibility to the PM Agent, and visual design/layout alignment to the Designer Agent (`DESIGN.md`). Produce clear technical & visual specifications before writing code.
2. Phase 2: Code Implementation (Engineer Agent). The Engineer Agent implements code changes strictly following Phase 1 specifications, then runs `cd extension-react && pnpm build` to verify zero TypeScript compilation or Vite bundler errors.
3. Phase 3: Audit, Iterative Cycle & Sign-off (REPEAT Loop). Pass implemented code back to the Designer or PM Agent for visual and code-level inspection. If the audit fails or identifies flaws, repeatedly cycle through Phase 1 (revision feedback) and Phase 2 (code fixes) until explicit approval (`PASSED`) is granted. Deliver final changes only after sign-off.
