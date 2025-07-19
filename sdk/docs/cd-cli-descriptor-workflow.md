
# cd-cli: Descriptor-Driven & Workflow-Executed Module Development

Unlike traditional backend development, where developers manually craft controllers, services, and models, **cd-cli** automates module development using a unique combination of **descriptors** and **workflow definitions**.

---

## 🔹 Descriptors Paradigm

A **descriptor** is a structured definition that acts as a blueprint for a module. It contains metadata and configuration about:

- Module name and type
- Controllers, services, and models
- Entry points and internal structure

In `cd-cli`, descriptors are dynamically loaded using the method:

```ts
CICdRunnerService.loadModuleDescriptorAndWorkflow()
```

This method retrieves a `CdModuleDescriptor` using:

```ts
CdModuleDescriptorService.cdApiModuleData(moduleName, moduleType, cdToken)
```

This descriptor is later passed into workflows for task execution.

---

## 🔹 Workflow-Driven Execution Paradigm

The **workflow** is a script associated with each module, defining steps to perform tasks like create, upgrade, or migrate.

### Execution Flow

1. Descriptor and workflow file are dynamically imported.
2. A workflow method (e.g. `upgradeWorkFlow()`) is called based on the action.
3. This returns a `CiCdDescriptor` — a pipeline of stages and tasks.
4. `CICdRunnerService.run()` executes the pipeline by traversing tasks and applying logic accordingly.

### Key Concepts

- **Tasks**: Represent individual steps in a stage.
- **Stages**: Logical grouping of related tasks.
- **Policies**: Control the flow based on previous results.

---

## 🔹 Role of app-craft/workshop

The `app-craft/workshop` directory houses:

- **Templates** for generating files (controllers, models, services)
- **Models** used to define descriptors
- **Workflows** for each module type (e.g., `cd-app`, `cd-module`)

This provides a fully AI- and developer-friendly sandbox for modular development.

---

## 🔹 Summary

| Traditional Dev | cd-cli |
|------------------|--------|
| Manual code writing | Descriptor-driven definitions |
| Linear scripting | Workflow-based execution |
| High error risk | Structured and validated pipelines |
| Developer-bound | AI-assisted and reproducible |

By embracing **descriptors** and **workflow execution**, `cd-cli` brings automation, repeatability, and AI integration to backend module development.

---
