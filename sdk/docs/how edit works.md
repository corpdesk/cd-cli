# Corpdesk CLI: Auto Create & Edit Workflow Documentation

This documentation explains the design and usage of the **cd-cli auto create and edit workflows** in the Corpdesk architecture. It serves as a reference for how modules, controllers, models, and services can be automatically scaffolded and iteratively maintained using standardized workflows constrained by metadata.

---

## 📦 Overview

The `cd-cli` tool provides an automated way to generate and evolve Corpdesk modules and components using a dev mode strategy that supports multiple methods: `context`, `json`, `wizard`, and `ai`.

These workflows are orchestrated using a descriptor model called `DevModeModel`, and executed via a service runner conforming to `CiCdDescriptor` standards.

---

## 📐 DevModeModel

```ts
export interface DevModeModel {
  method: 'wizard' | 'manual' | 'ai' | 'json' | 'context';
  process: 'create' | 'read' | 'update' | 'delete';
  workflow: CiCdDescriptor;
}
```

This model defines the dev strategy, the operation process (`create`, `edit`, etc.), and the detailed execution pipeline described in `CiCdDescriptor`.

---

## 🧩 CiCdDescriptor Overview

The core descriptor for driving workflows:

```ts
export interface CiCdDescriptor extends BaseDescriptor {
  cICdPipeline?: CICdPipeline;
  cICdTriggers?: CICdTrigger;
  cICdEnvironment?: CICdEnvironment;
  cICdNotifications?: CICdNotification;
  cICdMetadata?: CICdMetadata;
}
```

The key subcomponent in all flows is `cICdPipeline`, which includes `stages` and `tasks`.

### Example Create Pipeline:

```json
{
  "name": "Create Module Pipeline",
  "type": "dev-env-setup",
  "stages": [
    {
      "name": "Initialize Repository",
      "tasks": [
        {
          "name": "create-repository",
          "type": "method",
          "executor": "cd-cli",
          "className": "CdModuleService",
          "methodName": "createRepository",
          "status": "pending"
        }
      ]
    },
    {
      "name": "Setup Workstation",
      "tasks": [
        {
          "name": "sync-to-workstation",
          "type": "method",
          "executor": "cd-cli",
          "className": "CdModuleService",
          "methodName": "syncToWorkstation",
          "status": "pending"
        }
      ]
    }
  ]
}
```

### Example Edit Pipeline:

```json
{
  "name": "Edit Module Pipeline",
  "type": "integration",
  "stages": [
    {
      "name": "Edit Cycle",
      "tasks": [
        {
          "name": "test-module",
          "executor": "cd-cli",
          "type": "method",
          "className": "CdModuleService",
          "methodName": "testModule",
          "status": "pending"
        },
        {
          "name": "modify-module",
          "executor": "cd-cli",
          "type": "method",
          "className": "CdModuleService",
          "methodName": "modifyModule",
          "status": "pending"
        },
        {
          "name": "add-new-features",
          "executor": "cd-cli",
          "type": "method",
          "className": "CdModuleService",
          "methodName": "addFeatures",
          "status": "pending"
        },
        {
          "name": "sync-to-repo",
          "executor": "cd-cli",
          "type": "method",
          "className": "CdModuleService",
          "methodName": "syncToRepository",
          "status": "pending"
        }
      ]
    }
  ]
}
```

---

## 🏗️ `CdModuleService` Structure

```ts
export class CdModuleService {
  private runner: CICdRunnerService;

  init(): this {
    this.runner = new CICdRunnerService();
    return this;
  }

  async create(d: CdModuleDescriptor, model: DevModeModel): Promise<CdFxReturn<null>> {
    return await this.runner.run(model.workflow);
  }

  async edit(d: CdModuleDescriptor, model: DevModeModel): Promise<CdFxReturn<null>> {
    return await this.runner.run(model.workflow);
  }
}
```

The service avoids DI to prevent circular dependency complexity. Initialization uses the `.init()` lifecycle pattern.

---

## 📁 Project Structure

* `src/CdCli/app/mod-craft` → Main CLI engine
* `src/CdCli/sys/dev-descriptor/services/cd-ci-runner.service.ts` → Responsible for executing workflows
* `mode-craft/workshop` → Location for generated modules under development

---

## 🛠️ CLI Usage

### Context Method:

```bash
cd-cli dev create cd-api --method context --name cd-ai
cd-cli dev edit cd-api --method context --name cd-ai
```

### JSON Method:

```bash
cd-cli dev create cd-api --method json --model ./cd-ai.create.workflow.json
cd-cli dev edit cd-api --method json --model ./cd-ai.edit.workflow.json
```

### Wizard or AI Method (future scope):

```bash
cd-cli dev create cd-api --method wizard
cd-cli dev edit cd-api --method ai
```

---

## 📑 Sample JSON for `model` Argument

`cd-ai.edit.workflow.json`

```json
{
  "method": "json",
  "process": "update",
  "workflow": {
    "cICdPipeline": {
      "name": "Module Edit",
      "type": "integration",
      "stages": [
        {
          "name": "Iterative Update",
          "tasks": [
            {
              "name": "test-module",
              "executor": "cd-cli",
              "type": "method",
              "className": "CdModuleService",
              "methodName": "testModule",
              "status": "pending"
            },
            {
              "name": "modify-module",
              "executor": "cd-cli",
              "type": "method",
              "className": "CdModuleService",
              "methodName": "modifyModule",
              "status": "pending"
            },
            {
              "name": "add-new-features",
              "executor": "cd-cli",
              "type": "method",
              "className": "CdModuleService",
              "methodName": "addFeatures",
              "status": "pending"
            },
            {
              "name": "sync-to-repo",
              "executor": "cd-cli",
              "type": "method",
              "className": "CdModuleService",
              "methodName": "syncToRepository",
              "status": "pending"
            }
          ]
        }
      ]
    }
  }
}
```

---

## 📌 Notes

* `create()` workflow is **linear**.
* `edit()` workflow is **cyclical**, following a `test -> modify -> enhance -> sync` pattern.
* All logic is driven from structured metadata — perfect for AI-enhanced dev flows.

---

## 📚 Next: Controller Crafting & Advanced Testing

Will include interactive AI methods, semantic tracking, and hot reload support.
