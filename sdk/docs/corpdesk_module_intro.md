# Introducing the Corpdesk Module Architecture

## Overview

Corpdesk modules in `cd-cli` follow a clean, standardized architecture that organizes automation logic into three essential directories:

```
📦 <corpdesk-module>
├── controllers/   // Handles logic exposed to other modules or CLI
├── services/      // Handles processing and utility logic
├── models/        // Defines data structures, types, and descriptors
```

This modular breakdown not only enforces separation of concerns but also lays the foundation for scalable automation, terminal-driven workflows, and AI-assisted development.

In this guide, we explore these principles using the `app-craft` module as our base example.

---

## 1. Controller Layer — Entry Point for CLI and AI

The `CdModuleController` acts as the bridge between developer instructions (via `cd-cli`) and backend services. It's the central executor of module-oriented commands like `create`, `read`, `update`, and `delete`.

### Sample Controller: `cd-module.controller.ts`

```ts
export class CdModuleController {
  svCdModule: CdModuleService;
  constructor() {
    this.svCdModule = new CdModuleService();
    this.svCdModule.init();
  }

  async create(moduleName: string, moduleType: string, cdToken: string): Promise<CdFxReturn<null>> {
    return this.svCdModule.create(moduleName, moduleType, cdToken);
  }

  async read(q?: IQuery): Promise<CdFxReturn<CdModuleDescriptor[] | null>> {
    return this.svCdModule.read(q);
  }
  // ... other methods ...
}
```

---

## 2. Service Layer — Intelligent Behavior Processing

Services implement the core business logic and automation behavior. They are internal to the module and invoked only by controllers.

### Fictitious Service Class: `cd-module.service.ts`

```ts
export class CdModuleService {
  async init(): Promise<void> {
    // Create required scaffolding or config for modules
  }

  async create(moduleName: string, moduleType: string, cdToken: string): Promise<CdFxReturn<null>> {
    // Step 1: Scaffold directory
    await this.createModuleDirectories(`./src/CdCli/app/${moduleName}`);

    // Step 2: Write initial model.json, controller.ts, service.ts
    // ... logic ...

    return { state: true, data: null, message: `Module ${moduleName} created.` };
  }

  async read(q: IQuery): Promise<CdFxReturn<CdModuleDescriptor[]>> {
    // Query registered module.json files
  }

  async createModuleDirectories(path: string): Promise<CdFxReturn<null>> {
    // Create controllers/, models/, services/ folders
  }
}
```

---

## 3. Model Layer — Structured Knowledge and Descriptors

Models represent metadata about the modules and the CLI instructions they expose.

### Sample Model: `cd-module-descriptor.model.ts`

```ts
export interface CdModuleDescriptor {
  name: string;
  type: string;
  version: string;
  createdAt: Date;
  description?: string;
}
```

These descriptors can be stored in JSON files or exported as part of `.model.ts` files for automated lookups.

---

## 4. Class Diagram (Simplified)

```mermaid
classDiagram
  class CdModuleController {
    +create(name, type, token)
    +read(query)
    +delete(query)
  }

  class CdModuleService {
    +create(name, type, token)
    +read(query)
    +createModuleDirectories(path)
  }

  class CdModuleDescriptor {
    -name: string
    -type: string
    -version: string
  }

  CdModuleController --> CdModuleService
  CdModuleService --> CdModuleDescriptor
```

---

## 5. Terminal to AI Evolution

### Phase 1: Manual Commands

```bash
> create --module --name cd-ai --type cd-api;
```

### Phase 2: CLI-Assisted Development

- Intelligent prompt suggestions
- Auto-filled `--type` and `--name` options from registry
- Logging and documentation automation

### Phase 3: AI-Driven Development

- AI reads goals from roadmap and executes commands
- Suggests descriptors, changelogs, and doc updates
- Learns from usage patterns to improve development flow

---

## 6. Key Takeaway

> A Corpdesk module is not just a code unit—it’s a self-descriptive, extensible, automatable development entity.

By structuring every module using the controller-service-model triad, `cd-cli` makes it possible to:

- Scaffold modules quickly
- Synchronize with Git or remote repos
- Transition from static coding to AI-guided workflows

---

## 7. Controller Scaffolding Guide

To simplify automation, controllers follow predictable naming and structure patterns.

### Standard Pattern

```ts
// src/CdCli/app/app-craft/controllers/<cdObjTypeName(SnakeCase)>.controller.ts
export class <cdObjTypeName(PascalCase)>Controller {
  sv<cdObjTypeName(PascalCase)>: <cdObjTypeName(PascalCase)>Service;
  constructor() {
    this.sv<cdObjTypeName(PascalCase)> = new <cdObjTypeName(PascalCase)>Service();
    this.sv<cdObjTypeName(PascalCase)>.init();
  }

  async <DevModeActionBasedMethod>() : Promise<CdFxReturn<null>> {
    // Delegates to service
  }
}
```

### Example Controller for `App`

```ts
export class AppController {
  svApp: AppService;
  constructor() {
    this.svApp = new AppService();
    this.svApp.init();
  }

  async upgrade(appName: string, appType: string, cdToken: string): Promise<CdFxReturn<null>> {
    return this.svApp.upgrade(appName, appType, cdToken);
  }
}
```

This convention makes it easy to:

- Auto-discover controllers
- Generate or modify them via `cd-cli`
- Ensure uniformity across module components

---

