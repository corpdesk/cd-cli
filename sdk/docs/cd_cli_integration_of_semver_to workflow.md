# Integration of Semantic Versioning in Coprdesk Workflow (CiCdDescriptor)

## Overview

This document defines how **Corpdesk** integrates **Semantic Versioning**, **Roadmap**, and **Milestone** data within the context of the `CiCdDescriptor` interface. The goal is to create a flexible, standardized workflow definition for automating project upgrades, documentation updates, changelog maintenance, and version-based downgrading or restoration.

---

## 1. The Role of `CiCdDescriptor`

The `CiCdDescriptor` is a central, flexible, and generic interface for defining various components of a CI/CD pipeline in Corpdesk. It encapsulates the entire delivery lifecycle of a software module or project.

### Key Capabilities:

* **Defines Pipelines:** Through the `cICdPipeline` property.
* **Configures Triggers:** Using `cICdTriggers` for push, pull request, scheduled or manual execution.
* **Supports Environments:** Such as staging, production, or testing via `cICdEnvironment`.
* **Drives Notifications:** Including email, Slack, and webhooks through `cICdNotifications`.
* **Captures Metadata:** Including versioning, creation timestamps, and repository metadata.

The `CiCdDescriptor` is therefore a **foundation for dynamic, automated project control and visibility**.

---

## 2. Semantic Versioning as the Workflow Key

**Semantic Versioning** (SemVer) uses the format `MAJOR.MINOR.PATCH`.

In Corpdesk:

* **MAJOR** represents the Roadmap → `CICdPipeline.versionTag`
* **MINOR** represents the Milestone → `CICdStage.name` or similar
* **PATCH** optionally identifies a specific task or patch level → `CICdStage.patchNumber`

This relationship allows for seamless lookup, mapping, and automation:

| Semantic Part | Maps To     | Descriptor Field          |
| ------------- | ----------- | ------------------------- |
| MAJOR         | Roadmap     | `CICdPipeline.versionTag` |
| MINOR         | Milestone   | `CICdStage.name`          |
| PATCH         | Patch Level | `CICdStage.patchNumber`   |

SemVer enables both upgrade and downgrade workflows by standardizing version labels that relate directly to CI/CD pipeline structure.

---

## 3. Git Integration and Completion References

Each Git commit and tag has a unique hash. Corpdesk leverages this by linking CI/CD descriptors to Git metadata.

### Integration Points:

* `CICdPipeline.completionRef` → commit/tag when roadmap is completed
* `CICdStage.completionRef` → commit/tag when stage is completed
* `CICdTask.completionRef` → commit/tag when task is marked complete
* `ChangeLogDescriptor.tagRef` → tag associated with a changelog version

### Input Flexibility:

When inputting a version for operations such as upgrade or rollback, the system accepts:

* **Semantic version** (e.g., `v1.2.3`)
* **Git SHA hash** (e.g., `3f1c2e7`)

This dual-input system improves flexibility and precision:

| Input Type       | Use Case                            | Example   |
| ---------------- | ----------------------------------- | --------- |
| Semantic Version | Preferred for releases/upgrades     | `v1.2.3`  |
| Git SHA (short)  | Useful for rollbacks/debug sessions | `3f1c2e7` |

---

## 4. Auto-Upgrading with Version-Driven Lookup

With semantic versioning embedded into tags and commits, the upgrade flow becomes predictable:

### Upgrade Workflow:

1. **Input**: `--version 1.2.0` or `--version 3f1c2e7`
2. **Lookup**:

   * Resolve to `CICdPipeline` and `CICdStage` using version or SHA
3. **Analyze**: Current state, git tag, changelogs
4. **Determine Next Version**:

   * Using `determineNextVersion()` and CI/CD descriptor data
5. **Execute Tasks**:

   * Run all `CICdTask[]` of the current stage
   * Auto-commit, tag, and push changes
6. **Tag**:

   * Create `v1.2.1` or `v1.3.0` as per policy

This version-centric workflow enables **repeatable, deterministic upgrades**.

---

## 5. Downgrading and Restoration Support

The same mechanism used for upgrades also supports downgrades and restoration:

* **By Tag**: User inputs `--version v1.1.0`
* **By Commit**: User inputs `--version 9a7f2b3`

### Benefits:

* Restores project to a previously tagged version or commit
* Applies reverse or recovery workflows (custom per stage/task)
* Supports debug, rollback, or historical inspection scenarios

System ensures traceability and safety by linking to changelog and Git metadata.

---

## 6. Changelog & Documentation Synchronization

The descriptor supports auto-synchronization of:

* **Changelogs** via `CICdHistory.changelogs[]`
* **Documentation** via `CICdPipeline.devDocumentation[]`

### Automation Logic:

* After task execution:

  * Check for code changes
  * Auto-generate commit messages
  * Update changelogs with `tagRef`
  * Tag versions
  * Mark relevant documentation entries as `stable`

---

## 7. Benefits of Semantic-Integrated CI/CD

### ✅ Predictability

* Version numbers consistently reflect development position.

### ✅ Auto-Mapping

* Easy to map version to roadmap stage, changelog, and tag.

### ✅ Git Anchoring

* All stages and milestones can be traced back to Git commit or tag.

### ✅ Simplified CLI

* Users input `--version`, and automation handles the rest.

### ✅ Bi-Directional Flow

* Supports upgrade and downgrade flows by tag or SHA.

### ✅ Future-Proof

* SemVer aligns with popular Git flows and DevOps practices.

---

## 8. Sample Descriptor Integration

```ts
const descriptor: CiCdDescriptor = {
  name: 'core-api',
  cICdPipeline: {
    versionTag: '1',
    name: 'Core API Roadmap',
    type: 'dev-roadmap',
    versionTag: '1.2',
    stages: [
      { patchNumber: '2', name: 'Setup', tasks: [...], patchNumber: 0, completionRef: 'abc123' },
      { patchNumber: '3', name: 'Test', tasks: [...], patchNumber: 1 },
    ],
    devDocumentation: [...],
    devHistory: {
      changelogs: [
        { version: '1.2.0', date: '2025-06-30', tagRef: 'v1.2.0', changes: [...] }
      ]
    },
    completionRef: 'v1.2.0'
  }
};
```

---

## 9. CLI Impact Summary

| Feature             | Descriptor        | CLI Flag                                 |
| ------------------- | ----------------- | ---------------------------------------- |
| Semantic Tag or SHA | `version`         | `--version v1.2.0` or `--version abc123` |
| Roadmap             | `CICdPipeline`    | `--dev-roadmap`                          |
| Milestone           | `CICdStage`       | `--add-stage`                            |
| Task                | `CICdTask`        | `--add-task`                             |
| Docs                | `Documentation[]` | `--dev-doc`                              |
| Changelog           | `ChangeLog[]`     | `--dev-changelog`                        |

---

## Conclusion

Integrating Semantic Versioning into Corpdesk’s workflow definition enables a tightly-coupled and automated CI/CD process. By connecting roadmap, milestone, task, and changelog logic to the semantic version format and Git commit metadata, the system gains clarity, consistency, and precision in managing upgrades, downgrades, deployments, and version control.

The `CiCdDescriptor` becomes the central control structure not only for orchestration but for version-driven development and automation.

