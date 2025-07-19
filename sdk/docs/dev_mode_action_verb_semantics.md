# Understanding DevModeAction Semantics in cd-cli

## Overview

As cd-cli evolves into a language-oriented interface for controlling development workflows, it's important to define the semantics of verbs (DevModeActions) that form the command vocabulary. These verbs are not arbitrary—they represent software lifecycle intentions, and their clarity is critical to automation, extensibility, and user predictability.

This document outlines the meaning, distinctions, and hierarchy of each DevModeAction verb, along with their associated contexts, to eliminate ambiguity and guide future CLI design.

---

## Categories of DevModeAction Verbs

### 1. CRUD Operations (Fundamental Actions)

| Action | Description                       |
| ------ | --------------------------------- |
| CREATE | Add a new entity or artifact      |
| READ   | Fetch or list entity details      |
| UPDATE | Modify existing entity properties |
| DELETE | Remove an entity                  |

### 2. Directional Lifecycle Transitions

| Action  | Description                            |
| ------- | -------------------------------------- |
| UPGRADE | Move to a newer version or enhancement |
| MIGRATE | Shift to a new structure/architecture  |
| DEGRADE | Revert to a previous version           |
| REGRESS | Reproduce or roll back to prior state  |
| PROMOTE | Move artifact up the pipeline/env      |
| DEMOTE  | Move artifact down the pipeline/env    |

### 3. Divergence and Merging

| Action | Description                             |
| ------ | --------------------------------------- |
| MERGE  | Combine branches, configurations, etc.  |
| FORK   | Clone and diverge into a separate line  |
| BRANCH | Create a parallel workstream or variant |

### 4. Finalization Actions

| Action  | Description                              |
| ------- | ---------------------------------------- |
| RELEASE | Tag and announce a stable/public version |
| PACKAGE | Bundle for deployment or distribution    |

### 5. Syncing, Visibility & Exit

| Action | Description                                           |
| ------ | ----------------------------------------------------- |
| SYNC   | Pull latest or push current descriptors/state to disk |
| SHOW   | Display details or status of an object/context        |
| EXIT   | Exit the current REPL session or action mode          |

---

## Key Semantic Distinctions

### UPGRADE vs PROMOTE

- **UPGRADE** modifies the internal state or version (e.g., code improvements).
- **PROMOTE** elevates the current artifact to a new **environment** or stage (e.g., dev → staging).

### DEGRADE vs DEMOTE

- **DEGRADE** moves to an older version.
- **DEMOTE** changes environment state or privileges.

### FORK vs BRANCH

- **FORK** creates a new independent context (often full repo or roadmap).
- **BRANCH** stays within current context but diverges a workstream.

### RELEASE vs PACKAGE

- **RELEASE** focuses on versioning, communication, and publication.
- **PACKAGE** involves bundling assets for deployment or delivery.

---

## Enum Definition Proposal

```ts
export enum DevModeAction {
  // CRUD
  CREATE = 1,
  READ = 2,
  UPDATE = 3,
  DELETE = 4,

  // Directional Lifecycle
  UPGRADE = 5,
  MIGRATE = 6,
  DEGRADE = 7,
  REGRESS = 8,
  PROMOTE = 9,
  DEMOTE = 10,

  // Branching/Divergence
  MERGE = 11,
  FORK = 12,
  BRANCH = 13,

  // Finalization
  RELEASE = 14,
  PACKAGE = 15,

  // Syncing & Visibility
  SYNC = 16,
  SHOW = 17,
  EXIT = 18,
}
```

---

## Integration in cd-cli

These verbs are directly used in the REPL command structure:

```bash
cd-cli dev
> <DevModeAction> --<CdObjType> --name <CdObj> --type <CdObjType>
```

Example usages:

```bash
> upgrade --app --name cd-api --type cd-api
> promote --module auth --to staging
> fork --roadmap cd-api
> release --app cd-api --version 1.2.0
> package --module core-api --target docker
> show --module auth
> sync --app cd-api
> exit
```

---

## Descriptor Context

Each action is mapped to a descriptor model, helping the CLI resolve intent and context automatically:

| Action  | Descriptor Type                  |
| ------- | -------------------------------- |
| upgrade | `VersionControlDescriptor`       |
| promote | `CICdEnvironment`                |
| fork    | `CICdPipeline`, `RepoDescriptor` |
| release | `ChangeLogDescriptor`            |
| package | `DeploymentDescriptor`           |
| sync    | `.cd-versioning` file system     |
| show    | Any descriptor with CLI display  |
| exit    | Internal CLI control             |

---

## Future Considerations

- Introduce command groups (e.g., `version`, `pipeline`, `release`) to streamline logic
- Enable alias support (e.g., `promote` = `env-up`)
- Auto-generation of changelog and roadmap updates on relevant verbs
- Intelligent suggestion of next verbs based on state (for AI copilot)

---

## Conclusion

Establishing a rich yet unambiguous DevModeAction vocabulary empowers cd-cli to grow into a semantic CLI framework. By linking these verbs to descriptive models, workflows become composable, understandable, and automatable.

This foundation also opens up natural language possibilities for future AI integrations.

---

*Corpdesk – Designed for progressive clarity.*

