# Corpdesk Context Bundle

This bundle contains four linked documents intended to serve as your local-only canonical artifacts for Corpdesk. Save these files under `~/.corpdesk/context/` (or your preferred secure location). They are intended to be **local only** and should not be uploaded to cloud memory unless explicitly sanitized.

---

## 1) `corpdesk_context.md` — High-fidelity DNA of Corpdesk

> Purpose: A single-source, human- and machine-readable canonical description of Corpdesk: vision, architecture, runtime principles, core modules, integration points, and the design philosophy.


# corpdesk_context.md

## 1. Identity & Vision
- **Name:** Corpdesk
- **Mission:** Provide a runtime-modular, AI-native development and operations framework that enables safe, instant installation and lifecycle management of application modules across frontend and backend with minimal downtime.
- **Philosophy:** Sculpt systems as working art — modular, iterative, auditable, and automation-first.

## 2. Core Principles
- Runtime modularity (install/uninstall modules at runtime)
- AI-native scaffolding and automation (cd-cli + multiple AI backends)
- IP-first security (local-sensitive context + encrypted distribution)
- CLI-centric workflows
- Cloud & on-prem parity

## 3. Architecture Overview
### 3.1 Directories & Module Types
- `sys/` modules: core system-level services, always present, cannot be uninstalled at runtime.
- `app/` modules: user-installable application modules that can be added/removed at runtime.
- `cd-cli`: command-line control plane used for scaffolding, initializing AI sessions, installing modules, deployments.

### 3.2 Runtime Loader
- Loader service watches `app/` and `sys/` registries.
- Supports hot registration/unregistration of module routes, DI containers, and federation hooks.

### 3.3 Integration Points
- AI Providers: ChatGPT, Gemini, DeepSeek (pluggable provider adapters)
- Storage: MySQL/Postgres, managed DBs (use env-based connectors)
- Messaging: optional event bus (Redis/NSQ/Kafka)

## 4. CD-CLI Contract
- `ai:init` must accept: provider, module list, session purpose.
- `ai:build` must generate files locally and return checksums.

## 5. Security & Secrets
- No secrets in repo. Use OS keyrings or vault.
- All context files labeled with a `sensitivity` header.

## 6. Operational Patterns
- Active set: `core.md` + last-90-days `logs.md` for initialization.
- Archive policy: daily rotated archives in `archive/`.

## 7. Ownership & Contacts
- Owner: George Oremo (EMP Services Ltd)
- Project lead: (fill in)



---

## 2) `corpdesk_log.md` — Rolling Technical WIP & Decisions

> Purpose: A chronological, timestamped log of engineering decisions, experiments, patches, and example code snippets. This file is sensitive and should be local only.

````
# corpdesk_log.md

## Log format
- Each entry must have: Date, Author, Summary, Tags, Actionables, and optionally Code/CI snippets.

---

## [2025-08-08] — Session: Hybrid memory model design
- **Author:** George
- **Summary:** Agreed hybrid workflow: admin memory stored in ChatGPT persistent memory; IP-sensitive files local and loaded per-session. Implement cd-cli ai:init and context sync.
- **Actionables:** Implement ai:init stub, create local repo, draft corpdesk_context.md.

## [2025-08-07] — Duplicate menu bugfix
- **Author:** George
- **Summary:** Fixed by deduping `moduleGuid` in `getAclModule$()` method.
- **Snippet:**
```ts
this.retMenuCollection = uniqueBy(this.retMenuCollection, m => m.moduleGuid);
````

* **Tags:** bugfix, menu

---

## Guidelines for use

* Keep entries concise but complete. Mark entries `ARCHIVE` when older than X days and reference the archive file.
* Never paste full secrets or long proprietary code. Use references to files (e.g., `module/chat-support/service.ts`) instead.

```

---

## 3) `corpdesk_protocols.md` — Naming, Versioning & Templates

> Purpose: A set of formalized protocols to ensure consistency for module naming, versioning, interface contracts, CLI flags, and AI prompts.

```

# corpdesk\_protocols.md

## 1. Naming Conventions

* Modules: `lowercase-dash` (e.g., `project-tracker`)
* Controllers: `PascalCaseController` (e.g., `AuthController`)
* Services: `camelCaseService` (e.g., `userAuthService`)

## 2. Versioning

* Semantic major.minor.patch for modules: `1.0.0`
* Protocols use `Protocol-<name>-v<major>.<minor>` (e.g., `Protocol-Module-1.0`)

## 3. File Layout template for a module

* `module/<name>/package.json`
* `module/<name>/src/index.ts`
* `module/<name>/src/<module>.controller.ts`
* `module/<name>/README.md` (include protocol version)

## 4. AI Prompting Templates (for cd-cli use)

* Initialization brief (condensed): provide executive summary, active modules list, security notes, and today’s focus.
* Build prompt: include protocol version, module name, features list, and required interfaces.

## 5. Checklist for module acceptance

* No hard-coded secrets
* Has unit tests
* Has CI lint & build
* Has protocol version in README

```

---

## 4) Module-specific files, diagrams, credentials & code (manifest)

> Purpose: Define how module-specific assets are stored and tracked locally. DO NOT store credentials here unless encrypted.

```

# module-manifest.md

* Place each module under `~/.corpdesk/modules/<module-name>/`
* Each module directory should include:

  * `module.yml` (metadata): name, author, protocolVersion, createdAt, sensitivity
  * `src/` (code)
  * `diagrams/` (architecture diagrams, PNG/SVG)
  * `tests/` (unit/integration)
  * `README.md` (usage, protocol version, required env)

## Example module.yml

```yaml
name: chat-support
author: george
protocolVersion: Protocol-Module-1.0
sensitivity: sensitive
createdAt: 2025-08-08
```

## Credentials

* Store credentials in OS keyrings or a secrets manager.
* If necessary to version an encrypted credential bundle, use `age` or `gpg` with recipient public keys.

```

---

### How to use this bundle
1. Save each section as its respective file under `~/.corpdesk/context/`.
2. Add metadata headers and set `sensitivity: sensitive` where applicable.
3. Initialize a private git repo and add encryption for backups.
4. Hook cd-cli to read these files for `ai:init` and other commands.

---

*End of bundle.*

```
