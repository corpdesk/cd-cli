
# `cd-auto-git` Module Documentation

## Overview

The `cd-auto-git` module automates GitHub repository operations through the `cd-cli` tool. It provides structured controller, model, and (optionally) service code that allows CLI users to interact with GitHub in a standardized way.

---

## Directory Structure

```
src/CdCli/app/cd-auto-git/
├── controllers
│   ├── cd-auto-git.controller.spec.ts
│   └── cd-auto-git.controller.ts
├── models
│   ├── cd-auto-git.model.spec.ts
│   └── cd-auto-git.model.ts
└── services
```

---

## Controller: `cd-auto-git.controller.ts`

- Imports core Git interaction libraries and profiles
- Defines Git automation actions via CLI
- Makes use of `exec` and `promisify` from Node.js
- Integrates with `CdCliProfileController` and `CdCliVaultController` for authentication and vault-based credential management
- The controller serves as the main handler for Git operations like:
  - Creating a new repository
  - Authenticating with GitHub
  - Handling command line input via CLI subcommands

---

## Model: `cd-auto-git.model.ts`

- Contains constants and data definitions for Git automation
- Defines the CLI subcommand structure using an object `CD_AUTO_GIT_CMD`
- Supports options such as:
  - `--name`: Repository name
  - `--desc`: Repository description
  - `--priv`: Whether the repository is private
  - `--repoHost`: Host for the repository (e.g., GitHub, Corpdesk)
  - `--debug`: Enable debug mode for detailed output

---

## Usage Examples

```bash
# create a git repository
cd-cli auto-git create --name cd-ai --desc "AI module" --priv false --repoHost corpdesk --debug 4

# clone a git repository
cd-cli auto-git clone --repo-name cd-ai --repo-directory $home --git-host corpdesk --debug 4
```

### Explanation of Flags

- `--name <repoName>`: The desired name of the new repository (used in `create`).
- `--desc <repoDescription>`: A brief description of the repository.
- `--priv <true|false>`: Determines if the repository is private (`true`) or public (`false`).
- `--repoHost <host>` / `--git-host <host>`: The target Git host for your repository (e.g., `corpdesk`, `github`).
- `--repo-name <repoName>`: Name of the repository to clone (used in `clone`).
- `--repo-directory <path>`: The file system path where the repository should be cloned to.
- `--debug <level>`: Optional debug level (higher values enable more verbose logs).

---

## Corpdesk Module Template & Git Integration

The `cd-auto-git` module also plays a critical role in the template system of `cd-cli`. It:

1. **Syncs Git templates:** Ensures users always use the most recent version of templates by syncing via Git.
2. **Handles cloning:** Supports cloning templates like `abcd` into new modules.
3. **Supports version control:** Encourages version tagging and update discipline for reusable templates.

---

## Future Enhancements

- Add full support for services in the `cd-auto-git` module
- Auto-tag version updates of templates
- Sync templates across all environments with caching

