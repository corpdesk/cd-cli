# 📘 Patch Increment Guide for Corpdesk

## Overview

This document outlines the **principles**, **policies**, and **implementation guide** for supporting automated patch increments in Corpdesk-managed projects.

Patch increments are designed to manage micro-level changes that do not affect major roadmap or milestone targets but are critical to development traceability, CI/CD pipeline flow, and version control.

---

## 🎯 Design Principles

1. **Versioning Structure**

   * Follows Semantic Versioning: `MAJOR.MINOR.PATCH[-LABEL]`
   * Patch increments represent small, traceable updates within a given milestone.

2. **Automation First**

   * Patch incrementing is treated as a discrete and automatable task within the CI/CD pipeline.
   * Triggerable via workflow tasks or CLI calls.

3. **Documentation & Logging**

   * Every increment logs changes in `.cd/changelog.json` and optionally in `.cd/docs.json`.

4. **Git Versioning**

   * Automatically commits and tags the repo with the new version.

---

## 📏 Policy Guidelines

### Patch Incrementation Triggers

* Triggered during:

  * Post-task success conditions
  * Workflow stages marked for patch updates
  * Manual CLI command (`cd-cli patch-increment`)

### Policy Behavior

| Condition                    | Action                                 |
| ---------------------------- | -------------------------------------- |
| `patchLevel` is not given    | Current one is retained                |
| `upgrade` command given      | Patch is reset to the version in input |
| `incrementPatch()` is called | Patch level is auto-incremented        |

### Logging Targets

* `package.json`: Updates the `version` field
* `.cd/changelog.json`: Adds patch changelog entry
* `.cd/docs.json`: Adds documentation summary
* Git: Commit and tag with new version

---

## 🛠️ Implementation Guide

### Method Signature

```ts
incrementPatch(
  repoPath: string,
  version: SemanticVersionObject,
  opts?: { dryRun?: boolean; commitMessage?: string }
): Promise<CdFxReturn<SemanticVersionObject>>
```

### Implementation Steps

1. **Parse Current Tag**

   * Use `getCurrentVersionTag()` and parse it into a `SemanticVersionObject`.

2. **Increment Patch**

   * Add `1` to existing patch number, or set to `1` if undefined.

3. **Generate Semantic String**

   * Convert `SemanticVersionObject` to string using `toSemantic()`.

4. **Update Artifacts**

   * Modify `package.json`, `.cd/changelog.json`, `.cd/docs.json`.

5. **Git Commit & Tag**

   * Commit all changes with message and apply tag `vX.Y.Z`.

6. **Return**

   * Return new version in `CdFxReturn<SemanticVersionObject>`.


## Use Case of opts.dryRun in the Context of Corpdesk Automation
## 🔧 What is opts.dryRun?

In most CLI tools and automation scripts, the dryRun flag (or --dry-run option) simulates the execution of a process without making actual changes. It's a safe test mode to preview actions.
🚀 Why it’s Relevant in Corpdesk Automation

In the mission of automated software lifecycle, especially with cd-cli, cd-app, and module workflows, dryRun is critical to ensure:

    Validation Before Execution
    Developers or CI systems can validate workflows (like upgrades, patches, or installs) without applying real changes to files, git history, or remote systems.

    Prevent Costly Mistakes

        Accidental upgrades.

        Overwrites to package.json, roadmap.json, etc.

        Tags or commits to production code.

    Enable Review & Logging
    dryRun allows outputting:

        Planned version tag.

        Modified roadmap/milestone/task stage.

        Files that would be updated.

        Git commands that would be run.

    Support Human-in-the-Loop Workflows
    Useful during:

        preview stages.

        Developer trials before automation.

        Manual approval before patch release.

## 📌 Example: incrementPatch({ dryRun: true })
```
await incrementPatch({
  repoPath: '/projects/cd-api',
  version: { major: 0, minor: 8 }, // No patch yet
  dryRun: true,
});

```

Expected Output (Dry Run Mode)
```
[DryRun] Current patch: 4
[DryRun] Next patch would be: 5
[DryRun] Would tag project as: v0.8.5
[DryRun] Would update files:
  - package.json
  - .cd/roadmap.json
  - .cd/changelog.json
  - .cd/docs.json

```

➡️ No tag is created.
➡️ No files are written.
➡️ A report is shown instead.
🧠 Implementation Insight

In most methods like upgrade(), incrementPatch(), afterUpgrade(), etc., opts.dryRun is checked like:

```
if (opts.dryRun) {
  CdLog.info(`[DryRun] Would write patch ${nextPatch}`);
  return cdFx(CdFxStateLevel.Info, 'Dry run mode. No patch was applied.', null);
}
```

✅ Summary

| Benefit                   | Description                                             |
| ------------------------- | ------------------------------------------------------- |
| Safe Testing              | Preview workflows without making changes                |
| Audit + Logging           | Supports visibility during CI or manual execution       |
| Guardrails for Automation | Prevents premature execution in live environments       |
| Versatility               | Works across all lifecycle steps — from clone to deploy |


Let me know if you’d like dryRun behavior scaffolded in incrementPatch() or added to other methods like upgrade() or afterUpgrade().

---

## 🚀 Future Extensions

* Add support for `bumpMinor()` and `bumpMajor()`
* Auto-detect if last commit modified patch-level files
* Integrate with semantic release rules

---

## 🧪 Testing Notes

* Use dry run mode to preview without actual file change.
* Simulate on dummy repo for verification before production usage.

---

## 📌 Summary

Patch incrementation is a precise mechanism to evolve software builds cleanly and traceably within minor development scopes. This approach ensures reproducibility, automation, and traceable delivery artifacts in CI/CD-managed systems.
