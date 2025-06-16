# Design & Developer Guide for a Generic Workflow Engine

## Overview

This guide outlines the design principles, architecture, and implementation guidelines for building a flexible, time-aware, and context-neutral **Workflow Engine**. It now integrates **scheduling capabilities**, suitable for both real-time automation and long-term task orchestration.

---

## Goals

* Flexibility: Adaptable to diverse domains (manufacturing, project management, automation).
* Decoupled Design: State transitions are configuration-driven.
* Time-aware: Unified with scheduling mechanics.
* Extensible: Supports advanced branching, transitions, and time control.

---

## Core Concepts

### 1. `CdFxStateLevel`

Defines lifecycle states in a consistent manner.

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
```

### 2. `CdFxReturn<T>`

Unified result contract for any executed task.

```ts
export interface CdFxReturn<T> {
  data?: T | null;
  state: boolean | CdFxStateLevel;
  message?: string | null;
}
```

### 3. `TransitionRule`

```ts
export interface TransitionRule {
  toTask: string;                // Target task ID
  ifState?: CdFxStateLevel;     // Optional state condition
  ifExpr?: string;              // Optional JS-like expression (data context)
  delayMs?: number;             // Optional delay before transitioning
  window?: ExecutionWindow;     // Optional time window constraint
}
```

### 4. `WorkflowTask`

An abstract representation of a unit of execution.

```ts
export interface WorkflowTask<T = any> {
  name: string;
  type: 'script-inline' | 'script-file' | 'method' | 'cdRequest';
  executor: ExecutionEnvironmentType;
  input?: T;
  script?: string;
  scriptFile?: string;
  className?: string;
  methodName?: string;
  cdRequest?: ICdRequest;
  cdVault?: CdVaultItem[];

  status?: 'pending' | 'running' | 'completed' | 'failed';
  transitions?: Record<string, TransitionRule[]>; // E.g. 'onSuccess', 'onError', etc.

  schedule?: ScheduleConfig;
  retry?: RetryConfig;
  timeout?: number;
}
```

---

## Schedule-Aware Extensions

### `ScheduleConfig`

```ts
export interface ScheduleConfig {
  isRecurring?: boolean;
  cron?: string;                // e.g. "0 0 * * *"
  intervalMs?: number;          // e.g. 3600000 for 1h
  runOnceAt?: string;           // ISO timestamp
  window?: ExecutionWindow;     // Define when it can run (optional)
  repeatUntil?: string;         // End date (ISO) for recurrence
  skipIfMissed?: boolean;
  catchUp?: boolean;
}
```

### `ExecutionWindow`

```ts
export interface ExecutionWindow {
  start: string;  // e.g. "09:00"
  end: string;    // e.g. "17:00"
  timezone?: string; // e.g. "Africa/Nairobi"
}
```

### `RetryConfig`

```ts
export interface RetryConfig {
  retryCount?: number;
  retryDelayMs?: number;
  backoff?: 'fixed' | 'exponential';
}
```

---

## `WorkflowDefinition`

```ts
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  tasks: Record<string, WorkflowTask>;
  startTask: string;
  globalTransitions?: TransitionRule[];
}
```

---

## Runtime Evaluation Model

* The engine executes from `startTask`
* Evaluates transitions based on `CdFxReturn.state`
* Checks time windows and scheduling rules
* Supports delayed or recurring task execution

---

## Scheduler Integration Points

* Cron-based task invocation
* Time-aware transitions (delays, windows)
* Declarative recurrence (`repeatUntil`)
* Dynamic workflows with time constraints

---

## GUI and Visualization Hints

* Each `WorkflowTask` renders as a node
* Transitions are labeled edges (with optional conditions)
* Scheduling can be shown using icons, labels, and tooltips

---

## Example: Timed Task

```ts
const exampleTask: WorkflowTask = {
  name: "generateReport",
  type: "script-inline",
  executor: "node",
  script: "return generateMonthlyReport();",
  schedule: {
    cron: "0 9 1 * *", // Every 1st day of month at 9AM
    isRecurring: true,
    skipIfMissed: false
  },
  transitions: {
    onSuccess: [{ toTask: "emailReport" }],
    onError: [{ toTask: "notifyAdmin" }]
  }
};
```

---

## Final Thoughts

* Workflow and Scheduler are now converged via `WorkflowTask`
* Time is optional but first-class
* All parts remain composable, readable, and GUI-friendly
* This foundation can power real-time engines, event processors, and long-lived orchestrators