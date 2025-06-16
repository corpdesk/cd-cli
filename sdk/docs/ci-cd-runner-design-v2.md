# Integrating `CICdRunnerService` with `CdScheduler`

## Overview

The `CICdRunnerService` is a critical component in the Corpdesk CI/CD automation flow. It leverages the generic capabilities of the `CdScheduler` module to manage execution of pipelines composed of stages and tasks. These tasks can be method calls, script executions, or CD requests, all dynamically resolved based on runtime conditions and result states.

This documentation focuses on how `CICdRunnerService` utilizes `CdScheduler` to implement CI/CD logic in a structured, flexible, and resilient way.

---

## Objectives

* Model CI/CD workflows using a standardized descriptor.
* Execute and transition between tasks based on `CdFxStateLevel`.
* Support dynamic task routing (`onResult`) within pipeline stages.
* Reuse scheduling logic provided by `CdScheduler` for consistency across Corpdesk workflows.

---

## Architecture

### 1. **Pipeline Model Structure**

Defined in `cicd-descriptor.model.ts`, the CI/CD structure comprises:

* `CICdPipeline`: A full CI/CD pipeline with named `stages`.
* `CICdStage`: A collection of sequential or conditional `tasks`.
* `CICdTask`: Executable units with result-based routing.

Each task declares:

* `type`: e.g., `method`, `script-file`, `cdRequest`, etc.
* `status`: Task execution lifecycle tracking.
* `onResult`: An array defining transitions based on `CdFxStateLevel`.

### 2. **Workflow Scheduling via `CdScheduler`**

The runner uses interfaces and types from `CdScheduler`, such as:

* `ExecutionEnvironmentType`: Defines the execution context (CLI, shell, runner).
* `WFNext`, `WFNextRef`: Refer to the next task in case of branching logic.

The `resolveNextTask` function uses these to determine the next task depending on the outcome.

### 3. **Result Routing Using `CdFxStateLevel`**

Instead of Boolean success/failure, each task result is matched against `CdFxStateLevel`, allowing more nuanced transitions. Example:

```ts
onResult: [
  { ifState: [Success, PartialSuccess], toTask: "postCreateRepository" },
  { ifState: [Fatal, SystemError], toTask: "notifyFailure" }
]
```

---

## Workflow Execution Lifecycle

### Entry: `run()`

* Accepts the module descriptor and CI/CD descriptor.
* Sets context and initiates the pipeline execution.

### Task Execution: `executeTask()`

* Dispatches based on task `type`:

  * `cdRequest`: Executes via `invokeCdRequest()`.
  * `method`: Reflectively invokes the method.
  * `script-inline` / `script-file`: Runs the appropriate script.

### Transition Logic: `resolveNextTask()`

* Evaluates `onResult` against the actual result.
* Returns the corresponding `WFNext` object, directing the scheduler to the next task.

### Normalization: `normalizeWFNext()`

* Translates `WFNextRef` into a concrete `WFNext` object.
* Provides consistent routing context across stages and pipelines.

---

## Sample Workflow

Excerpt from `cd-ai.create.workflow.ts`:

```ts
{
  name: "Create Module Repository",
  tasks: [
    {
      name: "createRepository",
      type: "method",
      cdRequest: { ... },
      onResult: [
        { ifState: [Success, PartialSuccess], toTask: "postCreateRepository" },
        { ifState: [Fatal, SystemError], toTask: "notifyFailure" }
      ]
    },
    { name: "postCreateRepository", ... },
    { name: "notifyFailure", ... }
  ]
}
```

The logic here is driven by `CdFxStateLevel`, enabling multiple result-based paths from a single task. This makes CI/CD logic extensible, human-readable, and tightly integrated with the scheduler backbone.

---

## Summary

The `CICdRunnerService` bridges CI/CD logic with the generic `CdScheduler` engine, enabling dynamic workflows, scheduled execution, and modular extensibility. It transforms the traditional Boolean-driven pipelines into a richer, state-aware, and flexible execution model that aligns well with the broader Corpdesk modular philosophy.
