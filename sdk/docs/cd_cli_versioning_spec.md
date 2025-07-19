# cd-cli Design and Implementation of Automated Versioning Process for Corpdesk Repositories

## 🎯 Objective
To design a standardized, scalable, and automated versioning process integrated directly into the `cd-cli` tool, enabling developers to manage release workflows, documentation, contributors, changelogs, and roadmaps with minimal human intervention—particularly for Corpdesk module repositories.

---

## 📦 Folder Structure Overview

```
.cd-versioning/
├── roadmap.json
├── changelog.json
├── contributors.json
├── docs/
│   └── DEVELOPMENT.md
```

Each file plays a specific role in the versioning and release pipeline.

---

## 🗺️ Roadmap Strategy

### Storage
- File: `.cd-versoning/roadmap.json`
- Format: JSON
- Single roadmap file per project
- Managed history is provided by Git — no version fields required

### Roadmap Entry Schema
```json
{
  "id": "auto-detect-pk-field",
  "title": "Auto-Detect Primary Field",
  "description": "Improve how entities detect their primary field based on controller prefix.",
  "status": "in-progress",
  "assignedTo": "george.oremo",
  "tags": ["automation", "entity-gen"]
}
```

### Lifecycle Values
- `planned`, `in-progress`, `done`, `cancelled`

### CLI Integration
```bash
cd-cli roadmap add-milestone
cd-cli roadmap mark-complete auto-detect-pk-field
```

---

## 📘 Documentation Strategy

### Storage
- File: `.corpdesk/docs/DEVELOPMENT.md`

### Key Rules
- No internal versioning
- Tracked by Git
- Snapshotted with every release tag

### Retrieval Example
```bash
git checkout tags/v1.0.0 -- .corpdesk/docs/DEVELOPMENT.md
```

---

## 📜 Changelog Strategy

### Storage
- File: `.corpdesk/changelog.json`

### Format
```json
[
  {
    "commitHash": "abc123",
    "author": "George Oremo",
    "date": "2025-07-09",
    "summary": "Refactored GenEntityService to detect primary field more accurately",
    "relatedMilestone": "auto-detect-pk-field"
  }
]
```

### CLI Integration
```bash
cd-cli changelog sync
```
- Auto-generates summaries from Git commit messages and diffs
- Maps related milestones using pattern detection or input flags

---

## 👤 Contributors Strategy

### Storage
- File: `.corpdesk/contributors.json`

### Format
```json
[
  {
    "name": "George Oremo",
    "email": "george.oremo@gmail.com",
    "role": "maintainer"
  }
]
```

### CLI Integration
```bash
cd-cli contributors sync
```
- Uses `git shortlog -sne` for aggregation

---

## 🏷️ Tagging & Releases

### CLI Integration
```bash
cd-cli release tag --version 1.0.0 --message "First Beta release"
```
- Validates completion of active roadmap milestones
- Includes latest changelog
- Snapshots `DEVELOPMENT.md`
- Tags Git and creates a release commit

---

## 🧠 Advanced Logic

### Contributor Matching
- Match authors to roadmap items based on Git commit attribution

### Summary Generation
- AI-powered commit summarization from `git diff` context

### Documentation Mapping
- All changelogs and roadmaps linked to specific documentation versions via Git tags

---

## 💡 Benefits

- No need for manual version tracking inside files
- Git is source of truth for history and tags
- Human involvement minimized via intelligent CLI tooling
- Clear evolution path for each Corpdesk repository
- Scalable to multiple developers and distributed teams

---

## 🔄 Sample Automation Flow

```bash
cd-cli roadmap add-milestone
cd-cli roadmap mark-complete refactor-pk-detector
cd-cli changelog sync
cd-cli contributors sync
cd-cli release tag --version 1.0.0-beta --message "Beta release with full automation"
```

This process ensures every release is traceable, reproducible, and documented without relying on scattered manual efforts.

---

## 🧭 Future Extensions

- Auto PR generation for milestone completion
- Slack or email notifications
- GitHub integration for pull request tagging
- `cd-cli ui` panel for roadmap and changelog visualization

