# Policies Guiding Workflow for Auto-Upgrading a Corpdesk Project

This document outlines the guiding policies and workflow considerations for implementing an automated upgrade mechanism within a Corpdesk project. It focuses on pragmatic integration with Git, version management, and roadmap-driven progress.

---

## 1. Git State Awareness

### 1.1. Local Repository State Check

* Detect if the current working directory is a valid Git repository.
* Check for uncommitted changes using `git status`.
* Ensure all changes are committed before proceeding.

### 1.2. Remote Synchronization

* Fetch and compare remote vs local branches.
* Use `git fetch` + `git status` or `git log` to identify divergence.

### 1.3. Branch and Tag Context

* Confirm active branch context via `git rev-parse --abbrev-ref HEAD`.
* Determine the latest tag with `git describe --tags` or `git tag --sort=-v:refname`.

## 2. Git State Interpretation and Upgrade Decisioning

### 2.1. Upgrade Pre-Checks

* Ensure the working directory is clean.
* Ensure user is on a supported branch (e.g., `main`, `develop`).

### 2.2. Policy on Local Priority (Single User)

* For single-user managed projects, prefer **local changes** over remote.
* Auto-pull should be skipped or warned if local branch is ahead.
* Provide override flag for force push (e.g., `--force-sync`).

## 3. Conflict Management Strategy

### 3.1. Local Conflict Handling

* Offer clear prompts or CLI flags for:

  * Stashing changes
  * Aborting upgrade
  * Auto-committing pending changes

### 3.2. Remote Conflict Policy

* If remote has diverged, allow for policy-based action:

  * Abort
  * Rebase (advanced)
  * Merge with resolution strategy

## 4. Roadmap & Milestone Validation

### 4.1. Roadmap Argument Handling

* If `--roadmap` is provided, validate existence in local roadmap.json or through API.
* Associate milestone progression via roadmap mapping.

### 4.2. Upgrade Target Determination

* If both `--roadmap` and `--milestone` provided:

  * Confirm milestone exists under roadmap.
  * Proceed only if valid.
* If none provided:

  * Default to next logical semantic version (based on Git tags or commit messages).

## 5. Version Tagging Strategy

### 5.1. Determining Current Version

* Use latest semantic Git tag (`git tag --sort=-v:refname`).
* Fallback: use `package.json` version or project metadata.

### 5.2. Determining Next Version

* Semantic Versioning: Determine based on:

  * Major upgrade → breaking changes
  * Minor upgrade → new features
  * Patch upgrade → fixes

### 5.3. Tag Creation and Push

* Create annotated tag: `git tag -a vX.Y.Z -m "Upgrade to vX.Y.Z"`
* Push tag to origin: `git push origin vX.Y.Z`

## 6. Upgrade Execution

### 6.1. Execution Flow

1. Validate Git status
2. Validate roadmap/milestone (if given)
3. Determine upgrade target version
4. Commit or stash pending work
5. Create tag
6. Run upgrade scripts (e.g., database migration, config patching)
7. Push to remote (if policy permits)
8. Update roadmap item as 'completed'
9. Update changelog/history records
10. Execute notification policy

### 6.2. Logging and Feedback

* Log every step clearly.
* On failure, provide actionable feedback (e.g., "Resolve merge conflict on file X").

## 7. Post-Upgrade Policies

### 7.1. Version Documentation

* Update CHANGELOG.md with version summary.
* Update metadata files (e.g., `package.json`, module descriptors).

### 7.2. Notify Stakeholders (Optional)

* Send upgrade report via email, Slack, or Git commit message body.

---

## Notes:

* This document is expected to evolve.
* The upgrade policy can include external validation such as running test cases or code audit before final tagging.

---

Prepared as part of the ongoing implementation for `upgrade --cd-app --name cd-api --type cd-api --roadmap rm-0.9.0 --milestone ms-45`

Date: 2025-07-12
