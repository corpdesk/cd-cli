# Design and Developer's Guide: Generic Workflow Engine

## Overview

This document outlines the architectural vision, data models, and implementation guidance for a **Generic Workflow Engine**. The engine is designed to orchestrate complex task flows across various domains such as software automation, manufacturing pipelines, project management, and more.

The engine provides a dynamic and declarative framework to define tasks, transitions, and execution semantics that can be interpreted both programmatically and visually (GUI-ready).

---

## Objectives

* **Domain-Agnostic Architecture**: Tasks and transitions are context-free and reusable.
* **Configurable State Semantics**: State meanings (e.g., Success, Error) are configurable without altering core logic.
* **Dynamic Execution Flow**: Transitions are driven by outcomes, not hard-coded logic.
* **Visual Representation**: The model can be rendered into flow diagrams (e.g., DAGs).
* **Integration Friendly**: Supports invocation via script, method, or external requests.

---

## Core Interfaces

### `CdFxStateLevel`

A stable enum representing state outcomes:

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

### `CdFxReturn<T>`

A simple result wrapper:

```ts
export interface CdFxReturn<T> {
  data?: T | null;
  state: boolean | CdFxStateLevel;
  message?: string | null;
}
```

### `FxStateMeta` and `FxStateSemantics`

Allows UI or logic to map states to labels, colors, icons, etc.

```ts
export interface FxStateMeta {
  key: string;
  label: string;
  color?: string;
  icon?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'error' | 'success' | 'warning' | 'info';
}

export interface FxStateSemantics {
  mapping: Record<keyof typeof CdFxStateLevel, FxStateMeta>;
}
```

---

## Task and Workflow Model

### `GenericTask<T>`

```ts
export interface GenericTask<T = any> extends BaseDescriptor {
  id: string;
  name: string;
  type: 'script-inline' | 'script-file' | 'method' | 'cdRequest';

  executor: ExecutionEnvironmentType;
  execute?: {
    className?: string;
    methodName?: string;
    script?: string;
    scriptFile?: string;
    cdRequest?: ICdRequest;
  };

  input?: T;
  metadata?: Record<string, any>;
  cdVault?: CdVaultItem[];

  transitions?: {
    [stateLevel in keyof typeof CdFxStateLevel]?: TransitionRule[];
  };

  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
}
```

### `GenericWorkflow`

```ts
export interface GenericWorkflow {
  id: string;
  name: string;
  description?: string;
  semantics?: FxStateSemantics;
  tasks: GenericTask[];
}
```

---

## Transition Handling

### Edge Extraction Example

```ts
function extractEdgesFromTask(task: GenericTask): WorkflowEdge[] {
  return Object.entries(task.transitions || {}).flatMap(([state, rules]) => {
    return rules.map(rule => ({
      from: task.id,
      to: rule.targetTaskId,
      onState: state,
      condition: rule.condition
    }));
  });
}
```

---

## Sample JSON Workflow

```json
{
  "id": "wf-manufacturing",
  "name": "Widget Assembly Line",
  "semantics": {
    "mapping": {
      "Success": { "key": "Success", "label": "Completed", "category": "success" },
      "Error": { "key": "Error", "label": "Failure", "category": "error" }
    }
  },
  "tasks": [
    {
      "id": "start",
      "name": "Initialize Machine",
      "type": "method",
      "executor": "local",
      "execute": {
        "className": "MachineService",
        "methodName": "init"
      },
      "transitions": {
        "Success": [{ "targetTaskId": "check-sensors" }],
        "Error": [{ "targetTaskId": "log-failure" }]
      }
    }
  ]
}
```

---

## Summary

This architecture provides:

* A uniform model for defining and executing tasks
* A plug-and-play system for interpreting states
* Forward-compatibility with UI visualization and dynamic workflows
* An extendable engine that works across domains

Further extensions could include:

* Live visualization components
* Task templates and inheritance
* Multi-engine orchestrator
* Remote or containerized task execution support

---

End of document.
