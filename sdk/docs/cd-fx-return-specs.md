## 📘 CdFxReturn Specification

**Version:** `v1.1.0`
**Filename:** `cd-fx-return-helper.ts`
**Location:** Base directory of the project

---

### 🔰 Overview

`CdFxReturn<T>` is a standardized result type used across the Corpdesk system to capture the outcome of any asynchronous or synchronous process. It replaces ambiguous return types (`boolean`, `Error`, or `any`) with a structured, descriptive response model that supports:

* Type safety
* Fine-grained control over success and failure states
* Clear separation of system vs. logical outcomes
* Developer-friendly helper functions

---

### 🖐 Interface

```ts
export interface CdFxReturn<T> {
  data?: T | null;
  state: boolean | CdFxStateLevel; // interpreted through helper functions
  message?: string | null; // Optional error/success message
}

// default return on failure
export const CD_FX_FAIL = {
  data: null,
  state: false,
  message: "Failed!",
};

export enum CdFxStateLevel {
  Error = 0,
  Success = 1,
  PartialSuccess = 2,
  LogicalFailure = 3,
  Warning = 4,
  Recoverable = 5,
  Info = 6,
  Pending = 7,
  Cancelled = 8,
  NotFound = 9,
  NotImplemented = 10,
  SystemError = 11,
  Fatal = 12,
  Unknown = 13,
}
```

---

### 🧱 Some State Levels

#### `state: 0` – **System/Application Error**

> "Something went wrong with the code or the environment."

* The process was **interrupted** by a crash, missing file, null pointer, thrown error, or similar.
* Usually maps to `try/catch` blocks or unexpected internal behavior.

✅ Example:

```ts
{
  state: 0,
  message: "Database connection failed: Timeout.",
  errorLevel: 0
}
```

---

#### `state: 1` – **Success**

> "Everything went as expected."

* Operation completed successfully with intended effect.
* Any accompanying data can be accessed through `data`.

✅ Example:

```ts
{
  state: 1,
  message: "User created successfully.",
  data: { userId: "u123" }
}
```

---

#### `state: 3` – **Logical Failure**

> "The process ran, but the outcome didn’t meet business rules or input conditions."

* Typical for **validation errors**, **authentication failures**, **authorization denials**, etc.
* Not caused by code failure, but by **intentional logic branching**.

✅ Example:

```ts
{
  state: 3,
  message: "Login failed: Incorrect password.",
}
```

✅ Another:

```ts
{
  state: 3,
  message: "Form incomplete: Missing email address."
}
```

---

#### `state: 2` – **Partial Success / Recoverable Failure**

> "Some parts worked, others didn’t — handle gracefully."

* Useful in batch processes, multi-step flows, or pipeline executions.
* Often used with fallback logic or to **continue the flow** with warnings.

✅ Example:

```ts
{
  state: 2,
  message: "2 of 5 files uploaded. 2 failed due to size limits.",
  data: { uploaded: [...], failed: [...] }
}
```

---

#### `state: 6` – **Informational Only**

> "The process didn’t change state, but it's not a failure either."

* No change occurred, but that’s acceptable.
* Used for **idempotent operations**, **status checks**, etc.

✅ Example:

```ts
{
  state: 6,
  message: "Repository already exists. No further action needed."
}
```

---

### 🛠️ Helper File: `cd-fx-return-helper.ts`

```ts
import { CdFxStateLevel } from "./IBase.js";

// Overloads for direct state checks
export function isSuccess(state: boolean | CdFxStateLevel): boolean {
  return state === true || state === CdFxStateLevel.Success;
}

export function isPartialSuccess(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.PartialSuccess;
}

export function isLogicalFailure(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.LogicalFailure;
}

export function isWarning(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.Warning;
}

export function isRecoverable(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.Recoverable;
}

export function isInfo(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.Info;
}

export function isPending(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.Pending;
}

export function isCancelled(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.Cancelled;
}

export function isNotFound(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.NotFound;
}

export function isNotImplemented(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.NotImplemented;
}

export function isSystemError(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.SystemError;
}

export function isFatal(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.Fatal;
}

export function isUnknown(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.Unknown;
}

export function isFailure(state: boolean | CdFxStateLevel): boolean {
  return (
    state === false || state === CdFxStateLevel.Fatal || isRecoverable(state)
  );
}

export function getStateLevel(state: boolean | CdFxStateLevel): CdFxStateLevel {
  if (state === true) return CdFxStateLevel.Success;
  if (state === false) return CdFxStateLevel.Fatal;
  return state;
}
```

---

### 💡 Usage Pattern

```ts
const result = await someOperation();

if (isSuccess(result)) {
  continueWorkflow(result.data);
} else if (isLogicalFailure(result)) {
  notifyUser(result.message);
} else if (isPartialSuccess(result)) {
  retryFailedSegments(result.data);
} else if (isSystemError(result)) {
  logAndAbort(result.message);
} else if (isInfo(result)) {
  logInfo(result.message);
}
```

---

### 📌 Best Practices

* Always populate `message` meaningfully.
* Avoid using `state: false` or `true` in new code — migrate to `CdFxReturn`.
* Use helper methods to keep conditionals clean.
* Treat `state: 2` as a **normal part of business logic**, not as a bug.
* Consider extending `CdFxReturn` with metadata if needed (`code`, `retryable`, etc.)

---

Date: 2025-06-12, Time: 14:03
