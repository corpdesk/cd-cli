
# Developer Design Document: `app-craft`

## Overview

This document outlines the design and structure of the `app-craft` module within the `cd-cli` tool. The purpose of `app-craft` is to enable developers to create and manage software modules dynamically through a structured development workflow called **dev mode**.

---

## Objectives

- Automate the creation of modules and components (controllers, models, services)
- Support development via:
  - JSON descriptor files
  - Interactive wizard
  - AI-assisted generation
- Allow ongoing CRUD or modification at all levels (module, controller, model, service)
- Facilitate local development using a structured workspace (`workshop`)

---

## Directory Structure

### `app-craft` Directory

```
src/CdCli/app/app-craft/
├── controllers
│   ├── cd-controller.controller.ts       # Manages controller creation/modification
│   ├── cd-model.controller.ts            # Manages model creation/modification
│   ├── cd-module.controller.ts           # Manages module-level tasks
│   ├── app-craft.controller.spec.ts
│   └── app-craft.controller.ts           # Main entrypoint controller for app-craft operations
├── models
│   ├── app-craft.model.spec.ts
│   └── app-craft.model.ts                # Defines the data structure for CLI input and logic
├── services
│   ├── cd-controller.service.ts          # Business logic for managing controllers
│   ├── cd-model.service.ts               # Business logic for managing models
│   └── cd-module.service.ts              # Business logic for managing modules
└── workshop
    ├── cd-api                        # Development output for API modules
    ├── module-cli                        # Development output for CLI modules
    └── module-frontend                   # Development output for frontend modules
```

---

## Templates Directory

```
src/templates/
├── cd-api
│   └── abcd                              # Source template for new API modules
│       ├── controllers
│       ├── models
│       ├── services
│       └── README.md
├── module-cli
└── module-frontend
```

These templates are copied and customized during `cd-cli dev` operations.

---

## `cd-cli dev` Workflow

### Entry Command

```bash
cd-cli dev
```

### Options

```bash
# Create various module types
> create module-frontend --name cd-ai
> create module-cli --method context --name cd-ai <-- default method
> create cd-api --method context --name cd-ai <-- default method
> create cd-api --method --json-file ~/cd-ai.module.json
> create cd-api --method wizard
> create cd-api --method ai

# Create controller within a module
> create controller-api --json-file ~/cd-ai.controller.json
> create controller-api --name cd-ai cd-ai-usage-logs --module cd-ai
```

---

## Key Features

### 1. `workshop` Directory
- Acts as a sandbox for all active development modules.
- Separates outputs by type (API, CLI, Frontend).
- Facilitates isolation, easy cleanup, and version control.

### 2. Flexible Creation Methods
- **JSON File**: Predefined descriptor with schema.
- **Wizard**: Interactive question prompts.
- **AI**: Uses OpenAI API to generate modules based on natural language input.

### 3. Component-Level CRUD
- Controllers, models, and services can be added or updated independently.
- Allows modifying interfaces and method signatures without recreating the whole module.

---

## Development Tasks

- ✅ Initialize `app-craft` module and controllers/services
- ✅ Set up `workshop` directory structure
- 🔲 Implement CLI parsing and routing in `app-craft.controller.ts`
- 🔲 Add support for JSON-based module and controller generation
- 🔲 Add interactive wizard logic
- 🔲 Integrate AI-based templating and suggestion system
- 🔲 Track versioning and change history of each generated artifact

---

## Future Enhancements

- Support rollback and history of development
- Git sync with `cd-auto-git`
- Unit and integration test coverage
- UI interface for CLI options (e.g., web shell)

