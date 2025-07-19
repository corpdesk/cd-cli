# Roadmap and CLI Implementation Plan for cd-api Version Evolution

## 1. High-Level Roadmap Overview

This roadmap guides the evolution of `cd-api` from version `0.9.0` to `1.3.0`. Each milestone includes key version tags and their purpose. The roadmap is designed to be automated and managed via `cd-cli`.

### Roadmap Versions

| Version        | Description                                                           |
|----------------|-----------------------------------------------------------------------|
| `0.9.0`        | Initial tagged snapshot of current baseline code                       |
| `1.0.0-beta`   | CRUD automation ready via `cd-cli`                                     |
| `1.1.0`        | Core system-level refinements (SSL, CORS, main.ts, config.ts)         |
| `1.2.0`        | CI/CD automation for deployment                                       |
| `1.3.0`        | Packaging and full automation pipeline ready                          |

---

## 2. Detailed Roadmap JSON Structure

```json
[
  {
    "id": "rm-0.9.0",
    "title": "Initial Code Base Snapshot",
    "versionTarget": "0.9.0",
    "status": "done",
    "owner": "george.oremo@gmail.com",
    "lastUpdated": "2025-07-05",
    "milestones": [
      {
        "id": "ms-version-plan-doc",
        "title": "Document Version Management Plan",
        "description": "Define evolution and versioning plan for cd-api",
        "status": "complete"
      },
      {
        "id": "ms-tag-0.9.0",
        "title": "Declare and Tag 0.9.0",
        "description": "Use cd-cli to declare snapshot and tag cd-api",
        "status": "complete"
      }
    ]
  },
  {
    "id": "rm-1.0.0-beta",
    "title": "Automation Readiness",
    "versionTarget": "1.0.0-beta",
    "status": "in-progress",
    "owner": "george.oremo@gmail.com",
    "lastUpdated": "2025-07-09",
    "milestones": [
      {
        "id": "ms-doc-crud-status",
        "title": "Document CRUD Operational Status",
        "status": "complete"
      },
      {
        "id": "ms-code-review-crud",
        "title": "Code Review - CRUD Features",
        "status": "in-progress"
      },
      {
        "id": "ms-crud-patterns",
        "title": "Standardize CRUD Patterns",
        "status": "todo"
      },
      {
        "id": "ms-cd-cli-crud-gen",
        "title": "CRUD Code Auto-Generation",
        "status": "todo"
      },
      {
        "id": "ms-tag-1.0.0-beta",
        "title": "Tag 1.0.0-beta",
        "status": "todo"
      }
    ]
  },
  {
    "id": "rm-1.1.0",
    "title": "System Improvements",
    "versionTarget": "1.1.0",
    "status": "planned",
    "owner": "george.oremo@gmail.com",
    "milestones": [
      {
        "id": "ms-ssl",
        "title": "Enable SSL/HTTPS",
        "status": "todo"
      },
      {
        "id": "ms-cors",
        "title": "Enable CORS Middleware",
        "status": "todo"
      },
      {
        "id": "ms-refactor-main-config",
        "title": "Refactor main.ts and config.ts",
        "status": "todo"
      },
      {
        "id": "ms-tag-1.1.0",
        "title": "Tag 1.1.0",
        "status": "todo"
      }
    ]
  },
  {
    "id": "rm-1.2.0",
    "title": "Deployment Automation",
    "versionTarget": "1.2.0",
    "status": "planned",
    "owner": "george.oremo@gmail.com",
    "milestones": [
      {
        "id": "ms-setup-ci",
        "title": "Setup GitHub Actions for CI",
        "status": "todo"
      },
      {
        "id": "ms-auto-deploy-testbed",
        "title": "Auto Deploy to Testbed",
        "status": "todo"
      }
    ]
  },
  {
    "id": "rm-1.3.0",
    "title": "Packaging Automation",
    "versionTarget": "1.3.0",
    "status": "planned",
    "owner": "george.oremo@gmail.com",
    "milestones": [
      {
        "id": "ms-package-cli",
        "title": "Generate Deployment Packages",
        "status": "todo"
      },
      {
        "id": "ms-release-1.3.0",
        "title": "Tag and Release 1.3.0",
        "status": "todo"
      }
    ]
  }
]
```

---

## 3. Technical Implementation Guide

### 3.1 CLI Command to Initialize Versioning
```sh
cd-cli versioning init
```
- **Action**: Initializes `.cd-versioning` directory
- **Implication**: Sets up roadmap.json, changelog.json, contributors.json templates

---

### 3.2 Add Roadmap and Milestone
```sh
cd-cli roadmap add --version 1.0.0-beta --title "Automation Readiness"
cd-cli milestone add --roadmap 1.0.0-beta --title "CRUD Generator" --status todo
```
- **Action**: Adds roadmap and milestones to `.cd-versioning/roadmap.json`
- **Implication**: Auto-tracked via `cd-cli` with Git tag mapping

---

### 3.3 Tag Release Version
```sh
cd-cli version tag --version 1.0.0-beta --message "CRUD Automation Ready"
```
- **Action**: Git tag with `cd-cli` metadata
- **Implication**: Ensures changelog and docs are captured

---

### 3.4 Sync Contributors from Git
```sh
cd-cli contributors sync --from git
```
- **Action**: Pulls contributors from Git history
- **Implication**: Fills contributors.json automatically

---

### 3.5 Generate Auto Changelog from Git Commits
```sh
cd-cli changelog generate --since 1.0.0-beta
```
- **Action**: Parses Git log into structured changelog.json
- **Implication**: Reduces human dependency for change summaries

---

### 3.6 Link Documentation to Version
```sh
cd-cli docs link --version 1.0.0-beta --path sdk/docs/corpdesk-evolution-guide.md --status draft
```
- **Action**: Maps docs to specific version
- **Implication**: Enables traceability for future reference

---

### 3.7 Future: Wizard Mode
```sh
cd-cli release wizard
```
- **Action**: Interactive tagging, roadmap sync, changelog update
- **Implication**: Fully guided low-human-intervention process

---

## Summary
This plan lays the foundation for managing the full lifecycle of `cd-api` using `cd-cli`. From roadmap creation to release tagging and changelog generation, every phase can be automated and standardized.

The proposed roadmap ensures:
- Traceable evolution
- Consistent documentation
- Automated tagging, changelog, and contributor records
- Git-based traceability for every major release

