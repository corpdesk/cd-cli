# CdScheduler Module - Design and Developer's Reference

## Objectives

The `CdScheduler` module in Corpdesk is a core system module designed to enable dynamic, time-aware, and state-based task orchestration. Its main objectives are:

* **Support multi-dimensional workflows** with rich state transitions beyond simple Boolean checks.
* **Introduce time-awareness** through delayed executions, windows, retries, and schedules.
* **Centralize workflow capabilities** for reuse in systems like CI/CD pipelines, user-facing automation, and internal orchestration engines.
* **Decouple CI/CD implementation** from core scheduler logic by rooting execution logic in a shared scheduler design.

---

## Evolution Overview

### Phase 1: Linear/Boolean-Driven Process

Early implementations relied on a simple binary `state` to indicate success or failure. Transitions were linear, offering limited expressiveness.

```ts
export interface CdFxReturn<T> {
  data?: T | null;
  state: boolean;
  message?: string | null;
}
```

### Phase 2: State-Level Transitions

To capture more nuanced workflow states, we introduced `CdFxStateLevel`, an enum representing multi-dimensional process outcomes.

```ts
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

export interface CdFxReturn<T> {
  data?: T | null;
  state: boolean | CdFxStateLevel;
  message?: string | null;
}
```

### Phase 3: Introducing Time Dimension

The scheduler gained time-awareness through execution windows, delays, retries, and scheduled triggers.

```ts
export interface ExecutionWindow {
  start: string; // ISO timestamp or cron
  end?: string;
}

export interface RetryConfig {
  maxRetries: number;
  delayMs: number;
}
```

### Phase 4: Centralization in `sys/cd-scheduler`

Rather than implementing workflows in isolated modules like `cd/ci`, the design was refactored to use a centralized `sys/cd-scheduler`. All modules like `cd/ci` now consume this shared infrastructure.

---

## Core Interfaces

### `CdSchedulerTask`

```ts
export interface CdSchedulerTask<T = any> extends BaseSchedulerTask<T> {
  onResult?: TransitionRule[];
  onError?: TransitionRule[];
  onSuccess?: TransitionRule[];
  onStart?: TransitionRule[];
  onEnd?: TransitionRule[];
  onCancel?: TransitionRule[];
  onTimeout?: TransitionRule[];
  onRetry?: TransitionRule[];
  retry?: RetryConfig;
  schedule?: ScheduleConfig;
}
```

### `TransitionRule`

```ts
export interface TransitionRule {
  toTask: string;
  ifState?: CdFxStateLevel | CdFxStateLevel[];
  ifExpr?: string;
  delayMs?: number;
  window?: ExecutionWindow;
}
```

---

## Example Configuration

### Verbose Style (Pre-simplification)

```ts
onResult: [
  { ifState: CdFxStateLevel.Success, toTask: "postCreateRepository" },
  { ifState: CdFxStateLevel.PartialSuccess, toTask: "postCreateRepository" },
  { ifState: CdFxStateLevel.Fatal, toTask: "notifyFailure" },
  { ifState: CdFxStateLevel.SystemError, toTask: "notifyFailure" },
]
```

### Simplified Style (Supported)

```ts
onResult: [
  {
    ifState: [CdFxStateLevel.Success, CdFxStateLevel.PartialSuccess],
    toTask: "postCreateRepository",
  },
  {
    ifState: [CdFxStateLevel.Fatal, CdFxStateLevel.SystemError],
    toTask: "notifyFailure",
  },
  {
    toTask: "finalFallback" // Acts as an 'always' transition
  }
]
```

---

## Usage in `cd/ci`

The `cd/ci` runner service (`CICdRunnerService`) now builds upon `CdSchedulerTask`, making use of rich transition capabilities like:

* Matching multiple state outcomes in a single rule
* Conditional expressions (`ifExpr`)
* Retry policies
* Default fallbacks

This architecture allows CI/CD pipelines to be driven entirely by scheduler semantics.

---

## Next Step

A dedicated documentation for how `cd/ci` has been realigned to the new `cd-scheduler` architecture will follow, focusing on its role as a consumer of the shared scheduler logic.

---
