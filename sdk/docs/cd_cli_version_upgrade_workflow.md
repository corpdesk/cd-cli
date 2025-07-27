## Upgrade Workflow Guide for Corpdesk Modules

### Overview

This document provides a structured workflow to guide the upgrade process of a Corpdesk `cd-app`, ensuring consistency and automation across version tagging, roadmap alignment, changelog updates, and semantic versioning.

---

### Example Command

```bash
upgrade --cd-app --name cd-api --type cd-api --version 0.8.0
```

---

### Task 1: beforeUpgrade()

This step analyzes the version instruction and validates it against the current repository state and roadmap.

#### Steps:

1. **Check for Version Instruction**

   * If given, assume the user intends to upgrade.
   * If not, derive the next version from the roadmap.

2. **Validate Version Input**

   * Confirm it is a valid semantic version.
   * Validate it against the roadmap.

3. **Compare With Current Git Tag**

   * If a tag exists:

     * Ensure the new version is greater.
     * Otherwise, invalidate with `cdFx<T>()` return.
   * If no tag exists and version is given:

     * Allow tagging (first-time tagging).

4. **Determine Next Version**

   * Use the roadmap and current version to derive the next valid version.

5. **Guardrails**

   * Disallow downgrading.
   * Ensure version exists in roadmap.

---

### Task 2: upgrade()

This step carries out the upgrade changes in all relevant files and systems.

#### Steps:

* Create a Git tag
* Update Git repository state

### Task 3: afterUpgrade()

* Update `.cd/roadmap.json`
* Update `.cd/changelog.json`
* Update `package.json`
* Update `.cd/docs.json`

---

### Sample Reference Files Structure

```
.cd/
├── cd-app.descriptor.json
├── cd-module.descriptor.json
├── changelog.json
├── contributors.json
├── docs.json
└── roadmap.json
```

---

### Accessories

#### Accessory 1: Validate Roadmap

* **Input**: VersionControlDescriptor
* **Policy**: Ensure `.cd/roadmap.json` is valid against `CICdDescriptor`

#### Accessory 2: Read Roadmap

* **Input**:

  * `roadmapId`
  * `milestoneId` (optional)
  * `patchLevel` (optional)
* **Policy**:

  * Map semantic version parts to the descriptor fields:

| Semantic Part | Maps To     | Descriptor Field                   |
| ------------- | ----------- | ---------------------------------- |
| MAJOR         | Roadmap     | `CICdPipeline.versionTag`          |
| MINOR         | Milestone   | `CICdStage.orderId`                |
| PATCH         | Patch Level | `VersionControlDescriptor.patchId` |

#### Accessory 3: Validate Tagging

* **Input**:

  * `major`, `minor`, `patch`
  * VersionControlDescriptor
* **Policy**: Ensure the version tuple is consistent with roadmap

---

### VersionControlDescriptor Interface

```ts
export interface VersionControlDescriptor extends BaseDescriptor {
  patchLevel?: number; // serialized patch number for versioning
  repository: RepoDescriptor;
  versionControlBranch?: VersionControlBranch;
  devRoadmap?: CICdPipeline;
  devChangeLog?: ChangeLogDescriptor;
  sourceContributors?: SourceContributor[];
  versionControlTags?: VersionControlTag[];
  versionControlMetadata?: VersionControlMetadata;
}
```

---

### Semantic Mapping Summary

| Semantic Part | Maps To     | Descriptor Field                   |
| ------------- | ----------- | ---------------------------------- |
| MAJOR         | Roadmap     | `CICdPipeline.versionTag`          |
| MINOR         | Milestone   | `CICdStage.orderId`                |
| PATCH         | Patch Level | `VersionControlDescriptor.patchId` |

---
