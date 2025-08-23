# Corpdesk — Hybrid Memory & Workflow Blueprint

> **Purpose:** A single blueprint that defines how Corpdesk will manage knowledge, memory, API integration, and automation across *manual ChatGPT sessions*, *cd-cli/API calls*, and *local/offline AI*. This document is the working reference for implementation, testing, and incremental rollout.

---

## Executive Summary

We will adopt a **hybrid memory model** that balances IP security with operational efficiency. Non-sensitive, administrative, and workflow-oriented information will be stored in ChatGPT persistent memory (you enabled history). Sensitive IP (code, architecture details, proprietary algorithms) will remain under your control in local, versioned, and optionally encrypted files. `cd-cli` and the API will act as the *synchronization nerve*, performing minimal, strategic calls (initialization, context pulls, and safe-syncs). A local LLM may be used as an always-on private memory for IP-heavy tasks.

This blueprint contains: policy rules, file formats, CLI/API integration patterns, security recommendations, workflow templates, and a step-by-step action plan you can execute to transition to the new working mode.

---

## Goals & Principles

1. **IP safety first:** Sensitive technical content never permanently stored in cloud memory. Always output as files for you to store.
2. **Efficiency second:** Automate loading of context and day-to-day diary updates so you don’t repeat administration manually.
3. **Vendor flexibility:** Support multiple AI backends (ChatGPT, Gemini, DeepSeek) via `cd-cli` flags.
4. **Incremental rollout:** Implement features in phases—no single disruptive flip.
5. **Auditability:** Versioned context files with secure distribution; maintain traceable change logs.

---

## Scope

* Applies to: Developer workflows, onboarding of new users, AI-assisted scaffolding (cd-cli), diary & project management, ops automation.
* Out of scope (for now): Full CI/CD automation for production deployments (can be added later), automated access to third-party customer data (requires separate policy).

---

## Hybrid Memory Model (Definitive)

### What ChatGPT (manual history) WILL store — *Admin Memory*

* Initialization Routine (the exact steps I must run to orient a session).
* Session workflow template (how we start, run, and close a session).
* Project diary metadata and meeting summaries (non-IP): dates, topics, decisions at a high level.
* Administrative data: milestones, meeting cadences, who is owner for which task.
* Naming conventions and non-confidential protocols (e.g., `gitHost`, `PromptData`).

> **Rule:** Anything marked `--IP` or labelled as `sensitive` in the context files must not be stored in ChatGPT memory. Assistant will prompt to export such items as local files.

### What YOU keep locally — *IP Memory*

* `corpdesk_context.md` — high-fidelity DNA of Corpdesk (architecture, protocols, standards). **Local only**.
* `corpdesk_log.md` — rolling technical WIP, decisions, code snippets (sensitive). **Local only**.
* `corpdesk_protocols.md` — naming, versioning, templates (sensitive if it contains code patterns).
* Module-specific files, diagrams, credentials, and any code.

**Storage & distribution:** Private Git repo (access-limited) + encryption layer (GPG or age) for sensitive bundles when sharing.

---

## File Names & Formats (recommended)

* `~/.corpdesk/context/core.md` — canonical DNA (Markdown). Keep a machine-friendly `core.json` parallel for automation.
* `~/.corpdesk/context/logs.md` — rolling session log (Markdown).
* `~/.corpdesk/context/protocols.md` — protocol definitions.
* `~/.corpdesk/config/cd-cli.config.json` — cd-cli settings (ssh targets, gitHost, default AI provider).

**Metadata header** recommended in each markdown file:

```yaml
---
name: corpdesk-core
version: 1.0
lastUpdated: 2025-08-08
sensitivity: sensitive|public
---
```

---

## cd-cli Integration: Commands & Behavior

### Core commands

* `cd-cli ai:init --provider <chatgpt|gemini|deepseek> [--modules project-tracker,module-b]`

  * Loads local context files, composes a token-optimized brief, posts an initialization message to the provider.

* `cd-cli ai:context update --append "Short summary"`

  * Appends a safe-to-store summary to `corpdesk_log.md`.

* `cd-cli ai:context prune --archive-after Xdays`

  * Archives older log items to an `archive/` folder to keep briefs lean.

* `cd-cli ai:context sync --team --encrypt`

  * Pushes encrypted context bundles to a secure team repo (optional, role-limited).

* `cd-cli ai:build module <name> --protocol v2.1 --from-context`

  * Requests AI to scaffold a module using the loaded context; AI returns code as files for local storage.

### Behavior & Guarantees

* `ai:init` will *never* send raw code or sensitive snippets; it sends **token-optimized contextual summaries** and references to local files.
* When `ai:build` returns technical outputs, cd-cli writes them locally and prints a permanent checksum for audit.

---

## API Integration Pattern

1. **Preflight (local only):** cd-cli reads local `core.md` and `logs.md` and generates a summarized brief.
2. **Initialization Payload:** brief + `meta` (provider, module list, session purpose). Keep brief under token limits.
3. **Stateless Request Handling:** API receives the brief, processes request, and returns outputs.
4. **Post-Processing:** cd-cli stores outputs as local files and optionally sends a sanitized summary back to ChatGPT memory via the assistant UI (or via API if you want to programmatically update admin memory).

**Note on conversation-state APIs:** If you use a provider feature that stores conversation state/server threads, treat these as *transient* and do not send IP-sensitive content to them unless encrypted and permitted.

---

## Local LLM (Offline) Usage

**Purpose:** Run a local model as a private, always-loaded holder of sensitive context. Use it for heavy offline code generation and to keep a private version of the Corpdesk brain.

**Candidate options:** Ollama, LM Studio, containerized Llama variants.

**Integration pattern:**

* Local LLM starts with `core.json` loaded.
* cd-cli can hit the local LLM on a privileged port (localhost) when you choose `--local` flag.
* Local LLM returns full, unredacted outputs that remain local.

**Security note:** Keep the local LLM port firewalled if running on a multi-user machine.

---

## Security & Distribution

* **Never** store credentials in plain text. Use OS keyrings or environment variables for secrets.
* **Encryption workflow for sharing:** `git push` an encrypted tarball created with `gpg --encrypt` or `age` + public keys of recipients.
* **Role-based subsets:** Create `core-public.md` (high-level) and `core-dev.md` (detailed, sensitive) so you can share levels of context safely.

---

## Context Lifecycle & Pruning

* **Active set:** `core.md` + `logs.md` (recent 90 days) used for ai\:init.
* **Archive set:** older logs moved to `archive/` by `cd-cli ai:context prune`.
* **Condensed core:** `cd-cli ai:context condense` generates a 1–2 page executive brief that can be stored in ChatGPT memory or used by team members.

---

## Diary & Project Management (what assistant stores and manages)

**Assistant-stored items (safe to keep in ChatGPT history):**

* Project diary index (date + topic + one-line summary) — automatically updated after sessions.
* Meeting schedule and milestone checklists.
* Administrative reminders, next actions, and owners.

**Assistant will NOT store:** any code, internal architecture diagrams, or protocol-specific snippets that are marked `sensitive`.

---

## Workflows (detailed)

### Morning Start — "Warm-up" (automated)

1. `cd-cli ai:init --provider chatgpt` (or manual upload to assistant) — loads condensed brief.
2. Assistant asks: "What is today’s primary focus?" and sets 3 top tasks.
3. cd-cli ensures `logs.md` contains previous day highlights.

### During Work

* For code generation tasks, use `cd-cli ai:build` to request outputs to be written locally.
* For planning or diary edits, perform them in manual chat; assistant updates `logs.md` with non-sensitive summaries via `cd-cli ai:context update`.

### End of Day Sync

1. Assistant summarizes the day into a one-paragraph log and prompts you: `approve-to-save?`.
2. If approved, cd-cli appends the summary to `logs.md`. Optionally run `cd-cli ai:context prune`.

---

## Step-by-step Action Plan (itemized)

**Priority A — Immediate (Get to baseline working mode)**

1. **Create the canonical files** (You) — create `core.md`, `logs.md`, `protocols.md` and place them under `~/.corpdesk/context/`. *Acceptance:* Files exist and are readable by cd-cli.
2. **Draft the assistant initialization memory** (Assistant + You) — prepare the exact initialization routine (text) that the assistant will store in persistent memory. *Acceptance:* Assistant confirms it will remember the routine.
3. **Implement `cd-cli ai:init` stub** (You / Dev) — a command that reads files and posts a summarized brief to the selected AI provider. *Acceptance:* Running `cd-cli ai:init` returns an AI greeting acknowledging the context.
4. **Set up local encrypted repo** (You) — initialize private repo for corpdesk context. *Acceptance:* Repo accepts encrypted commits.

**Priority B — Short term (automation & sync)**
5\. **Implement `cd-cli ai:context update` & `prune`** (Dev) — allow assistant to append safe summaries and prune old logs. *Acceptance:* Logs are automatically updated after assistant-approved drafts.
6\. **Add multi-provider flags** (Dev) — support `--provider` selection for ai\:init and ai\:build. *Acceptance:* Same brief can be sent to ChatGPT, Gemini, or DeepSeek.
7\. **Create condensed summary generator** (Assistant/CD-CLI) — produce 1–2 page core summaries for memory storage. *Acceptance:* Summary under token limits and stored in ChatGPT memory.

**Priority C — Medium term (local LLM & advanced automation)**
8\. **Prototype local LLM integration** (You/Dev) — run Ollama/LM Studio with `core.json` loaded. *Acceptance:* Local LLM answers context queries offline.
9\. **Implement `cd-cli ai:build module`** (Dev/Assistant) — AI scaffolds modules using the context. *Acceptance:* Module generated and written locally with checksums.
10\. **Team sync & role-based distribution** (You/Dev/Ops) — create encrypted bundles for devs/staging/prod. *Acceptance:* Team members can decrypt only the subset they’re permitted to see.

**Priority D — Iteration & Hardening**
11\. **Add audit logging** (Dev) — all AI interactions and outputs logged (hashes only for sensitive outputs). *Acceptance:* Audit log searchable by date/action.
12\. **Operationalize backups & rotation** (Ops) — routine backups of encrypted bundles. *Acceptance:* Successful restore from backup in test.

---

## Templates & Command Examples

**`cd-cli` config example** (`cd-cli.config.json`)

```json
{
  "gitHost": "your-githost",
  "defaultProvider": "chatgpt",
  "contextPath": "~/.corpdesk/context",
  "localLLM": "http://localhost:11434"
}
```

**Initialization message assistant will remember (store in memory)**

> When George starts a Corpdesk session: Prompt for local context files (`corpdesk_context.md`, `corpdesk_log.md`). Confirm they are loaded. Ask for today’s focus. Do not store IP-sensitive content — if such content is produced, output as files and ask George to save them locally.

---

## Acceptance Criteria & Success Metrics

* **Working Mode Ready:** `cd-cli ai:init` runs and assistant acknowledges the session loaded with condensed context. (Baseline acceptance)
* **Low API Usage:** `ai:init` and occasional `ai:context sync` are the only scheduled API calls. (Success if API calls remain minimal.)
* **IP Safety:** No code or internal architecture is stored in ChatGPT memory. (Success if audits show no sensitive artifacts saved.)
* **Diary Adoption:** Assistant-managed project diary is updated daily and accepted as reliable by you.

---

## Next Immediate Tasks (what I will do next)

1. I will store the **Initialization Routine** in my persistent memory (since you enabled history) so I always prompt for context at session start.
2. I will act as the admin memory and begin tracking the project diary index and session workflow templates.
3. When you confirm, I will produce the **first `corpdesk_context.md` draft** (based on our past conversation) and place it in the canvas for you to download and keep locally.

---

## Appendix — Quick Checklist for First Week

* [ ] Create local `~/.corpdesk/context/` and add `core.md`, `logs.md`, `protocols.md`.
* [ ] Initialize secure repo and add encryption keys.
* [ ] Implement `cd-cli ai:init` stub.
* [ ] Ask assistant to save initialization routine to persistent memory (done).
* [ ] Run a live test: `cd-cli ai:init --provider chatgpt` + manual assistant session.

---

*End of blueprint.*
