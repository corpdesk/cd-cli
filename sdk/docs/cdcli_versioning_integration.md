# Integrating Standard Versioning to cd-cli Workflow Architecture

## 1. Step-by-Step Realization of the vision

The roadmap from planning to implementation is composed of 13 major steps. Each step, when mapped to CICdPipeline structures, becomes a task or stage within a development roadmap pipeline. This ensures each task can be orchestrated, documented, and tracked by the same automation system.

### Roadmap Steps Summary:

1. Define versioning plan
2. Declare/tag `v0.9.0`
3. Assess module creation requests
4. Document current state
5. Identify code repetition
6. Implement new patterns
7. Apply above across CRUD
8. Auto-generate CRUD code
9. Declare/tag `1.0.0-beta`
10. Refactor core files (SSL, CORS, config, etc.)
11. Declare/tag `1.1.0`
12. Add deployment automation (`1.2.0`)
13. Add packaging automation (`1.3.0`)

## 2. Map Plan to CICdPipeline Hierarchy

To harmonize version management into the CI/CD workflow system:

- `CICdPipeline` becomes the representation of the **entire roadmap**
- `CICdStage` becomes the **version milestone** (e.g. `1.0.0-beta`, `1.1.0`)
- `CICdTask` maps to **specific sub-activities** (e.g. document current status, auto-generate code)
- `CICdMetadata` stores project-wide references (createdBy, repository, etc.)
- `CiCdDescriptor.docs` (planned) points to one or more documentation files per stage
- `CICdPipeline.history` (planned) holds `ChangeLogDescriptor[]`

## 3. Define “Milestone” in This System

A milestone is represented by a **CICdStage**. Each stage contains tasks and associated metadata:

- `name`: version or goal (e.g. "CRUD Pattern Review")
- `status`: `todo`, `in-progress`, `complete`
- `tasks`: CICdTask[] representing atomic activities
- `docs`: documentation references

## 4. cd-cli Workflow Automation

### Syntax Design (Generic Pattern)

```bash
cd-cli dev
> <DevModeAction> --<CdObjType> --name <CdObj> --type <CdObjType>
```

### Supported CdObjType Additions

- `dev-roadmap`
- `dev-changelog`
- `dev-doc`

### DevModeActions:

- `create`
- `update`
- `read`
- `delete`
- `upgrade`
- `migrate`

## 5. .cd-versioning Directory Output

Every CLI interaction updates structured files under `.cd-versioning/`:

```bash
.cd-versioning/
├── changelog.json
├── contributors.json
├── docs.json
└── roadmap.json
```

Json type references:

- changelog.json: `CICdPipeline.history`
- contributors.json: `ContributorDescriptor[]`
- docs.json: `DocumentationDescriptor`
- roadmap.json: `CICdPipeline`

## 6. Summary of Adopted Principles

- Decompose project planning into **structured CI/CD pipelines**
- Use `CICdPipeline` as universal orchestrator
- Plug in `roadmap`, `changelog`, `docs` without breaking existing flow
- Use `VersionControlDescriptor.roadmap` as single source of truth

## 7. Proposed Pattern

### CLI Lifecycle

```bash
cd-cli dev
> create --dev-roadmap --name cd-api --type cd-api
> update --dev-roadmap --add-stage "CRUD Standardization" --status todo
> create --dev-doc --name evolution-guide --path docs/evolution-guide.md
> update --dev-changelog --type added --desc "Initialized roadmap integration"
```

## 8. Seamless Integration Across Objects

| Feature       | Descriptor Type             | CLI Impact                      |
| ------------- | --------------------------- | ------------------------------- |
| Roadmap       | `CICdPipeline`              | `create/update --dev-roadmap`   |
| Milestone     | `CICdStage`                 | `--add-stage`, `--update-stage` |
| Task          | `CICdTask`                  | `--add-task`, `--complete-task` |
| Documentation | `DocumentationDescriptor[]` | `--dev-doc`                     |
| Change Log    | `ChangeLogDescriptor[]`     | `--dev-changelog`               |
| Contributors  | `SourceContributor[]`       | Auto-synced from Git            |

## 9. Reusing CRUD Internally

With `cd-cli dev`, the CRUD engine is reused internally for:

- Updating `roadmap.json` entries
- Recording `changelog.json` changes
- Appending to `docs.json`

No new logic is needed. All actions are **modular** and rely on known models.

## 10. Future Extensions

- Add `pipeline history` viewer: `cd-cli roadmap view --history`
- Build `interactive wizard`: `cd-cli release wizard`
- Export pipelines as visual graphs (JSON/YAML)
- Plug into scheduler for date-based automation

---

This approach elegantly blends planning, execution, and evolution tracking into a unified architecture.

The roadmap is not a separate entity anymore; it's the main conductor of development activity, fully integrated with Corpdesk's CI/CD orchestration model.

