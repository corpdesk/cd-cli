📄 cd-cli Migration Guide: Moving from --type to --o-env and --repo

# Migration Guide: `--type` ➜ `--o-env` and `--repo`

## 🧭 Overview

In earlier versions of `cd-cli`, the `create` command accepted a `--type` flag that ambiguously defined the kind of environment or context (e.g. `test-bed`, `workshop`, etc.).

As the system matured and modularity increased, this single flag became insufficient to capture the dimensions required for accurate development contexts. 

To improve clarity, extensibility, and consistency, we are **deprecating** the `--type` flag in favor of a **dual-flag approach**:

- `--o-env`: Defines the output environment (e.g., `workshop`, `test-bed`, `ci-cd`, etc.)
- `--repo`: Specifies the base repository or project identifier (used to trace app/module context)

---

## 🔁 Before vs After

### Old Usage
```sh
cd-cli create --cd-module --name cd-ai --type test-bed
```

New Usage
```sh

cd-cli create --cd-module --name cd-ai --o-env test-bed --repo cd-api
```

This ensures that both environment and repository scope are clearly declared.



## 🧱 Design Rationale

| Concept                | Old `--type`  | New `--o-env` + `--repo`              |
| ---------------------- | ------------- | ------------------------------------- |
| Output Environment     | Implicit      | Explicit via `--o-env`                |
| Contextual Project     | Not supported | Defined via `--repo`                  |
| Module Type Derivation | Inferred      | Determined by repo context            |
| Validation             | Weak          | Strong (enum-based, descriptor-based) |
| Extendibility          | Limited       | Designed for growth                   |



## 🌐 Example Use Cases

# Creating a module in the workshop environment
cd-cli create --cd-module --name cd-ai --o-env workshop --repo cd-api

# Creating a module in the CI/CD environment
cd-cli create --cd-module --name cd-ai --o-env ci-cd --repo cd-api

# Local testing of a module
cd-cli create --cd-module --name cd-ai --o-env local-cd-cli --repo cd-api



## 🔄 Migration Strategy

| Step | Action                                                                        |
| ---- | ----------------------------------------------------------------------------- |
| ✅ 1  | Update CLI parser to recognize `--o-env` and aliases                          |
| ✅ 2  | Deprecate `--type` with a warning message                                     |
| ✅ 3  | Refactor all existing CLI templates, docs, and workflows to use `--o-env`     |
| ✅ 4  | Provide error handling and suggestions if an unrecognized `CdEnvName` is used |
| ✅ 5  | Allow fallback to `isDefault: true` environment if `--o-env` is not provided  |

---


## 🔎 Enforced Validations

    --o-env must match one of the CdEnvName enum values:

```ts
export enum CdEnvName {
  WORKSHOP = 'workshop',
  TEST_BED = 'test-bed',
  PRODUCTION = 'production',
  CI_CD = 'ci-cd',
  SANDBOX = 'sandbox',
  CUSTOM = 'custom',
  LOCAL_CD_API_APP = 'local-cd-api-app',
  LOCAL_CD_API_SYS = 'local-cd-api-sys',
  LOCAL_CD_API = 'local-cd-api',
  LOCAL_CD_CLI = 'local-cd-cli',
  LOCAL_FRONTEND = 'local-frontend',
  LOCAL_PWA = 'local-pwa',
}
```

--repo is validated via the VersionControlDescriptor.repository object, which includes:

```ts
    export interface RepoDescriptor {
      name: string;
      url: string;
      type: 'git' | 'svn' | 'mercurial' | 'other';
      appType?: AppType;
      ...
    }

```

## 📎 Migration Summary

| Migration Aspect | Resolution                                            |
| ---------------- | ----------------------------------------------------- |
| `--type` flag    | ❌ Deprecated                                          |
| `--o-env` flag   | ✅ Required                                            |
| `--repo` flag    | ✅ Required                                            |
| Compatibility    | ⚠️ Breaking change                                    |
| Benefits         | ✅ Clearer structure, better validation, extensibility |



