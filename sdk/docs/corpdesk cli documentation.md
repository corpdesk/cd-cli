# Corpdesk CLI Documentation

## 1. Mission, Objectives, and Goals

### Mission

To provide a unified, efficient, and scalable command-line interface (CLI) for managing and automating Corpdesk's app and system modules, while ensuring seamless communication with the `cd-api` backend.

### Objectives

* Standardize code structures across the CLI ecosystem.
* Facilitate predictable development through reusable patterns.
* Provide automation hooks to support AI-generated and human-authored development.
* Enable secure and consistent communication with Corpdesk backend services.

### Goals

* Improve developer productivity by enforcing consistent conventions.
* Reduce bugs by leveraging type-safe interfaces and error handling.
* Maximize code reuse through shared service/controller layers.
* Enable future AI-based CLI code generation and testing workflows.

---

## 2. Strategy to Achieve the Mission

1. **Modular Architecture:** Separate concerns into distinct system (`sys`) and application (`app`) areas.
2. **Unified Communication Layer:** Use a single `HttpService` to standardize API requests.
3. **Consistent Data Contracts:** Enforce `ICdRequest`, `ICdResponse`, and `CdFxReturn<T>` to define input/output schemas.
4. **Secure Credential Management:** Use `cd-vault` to store and resolve sensitive data references.
5. **CLI-Oriented Patterns:** Avoid dependency injection or constructor parameters to ease automation and instantiation.
6. **Standard Error Handling:** All functions follow `try/catch` and return `CdFxReturn<T>` for reliability.
7. **Developer Friendly Tooling:** Support scaffold generators and templates for new modules/controllers.

---

## 3. File and Directory Structure & Naming Conventions

### Project Root

```
src/CdCli/
├── app/              # Application area
├── sys/              # System area
├── base/             # Shared utilities (e.g., HttpService, IBase.ts)
├── cd-cli/           # CLI utilities and profile handlers
├── cd-comm/          # Communication and logging utilities
├── config.ts         # Global configuration constants
```

### Module Structure (Example: cd-auto-git)

```
src/CdCli/sys/cd-auto-git/
├── controllers/
│   └── cd-auto-git.controller.ts
├── models/
│   └── cd-auto-git.model.ts
├── services/
│   └── cd-auto-git.service.ts
```

### Naming Conventions

* **Files:** kebab-case (`cd-auto-git.controller.ts`)
* **Classes:** PascalCase (`CdAutoGitController`)
* **Instance Variables:**

  * Controllers: `ctl<ClassName>` (e.g., `ctlUser`)
  * Services: `sv<ClassName>` (e.g., `svUser`)

---

## 4. Coding Standards

### Interfaces and Communication

```ts
export interface CdFxReturn<T> {
  data: T | null;
  state: boolean;
  message?: string;
}

export const CD_FX_FAIL = {
  data: null,
  state: false,
  message: 'Failed!'
};
```

### HTTP Communication

* Use only `HttpService` for backend calls:

```ts
import { HttpService } from '../../base/http.service';
```

* Backend request and response must conform to `ICdRequest` and `ICdResponse`

### Error Handling

* All methods must use `try/catch`
* Always return `CdFxReturn<T>` to prevent fatal runtime errors

### Controller Initialization

* No constructor arguments:

```ts
const ctlUser = new UserController();
```

* No dependency injection (to avoid circular dependencies and automation complexity)

### Secrets and Profiles

* Resolve secrets via `cd-vault`
* Profiles loaded from configuration file, matched via `config.cdApiLocal`

### Debugging and Logging

* Use `CdLog.debug/info/error` for logging
* Set log level via `CdLog.setDebugLevel(level)`

---

This document forms the baseline for CLI operations, enhancements, and automation in the Corpdesk ecosystem. It ensures maintainability, reliability, and adaptability as we evolve the system further.
