# cd-cli Proof of Concept (POC): CJS-Compatible CLI Framework for Corpdesk Modules

## ✅ Summary of Achievements

The purpose of this POC was to establish a functional CLI (`cd-cli`) capable of dynamically discovering and executing modules in an isolated architecture, inspired by the runtime behavior of Corpdesk. The experiment successfully:

- Implemented a CLI entrypoint that dynamically resolves and executes command definitions from isolated module repositories.
- Demonstrated that the `create` command (from the cloned `abcd` module) could be executed without prior static linkage.
- Proved feasibility of isolated, installable runtime modules using `CommonJS` (`require`) and relative path resolution.

---

## ⚙️ Configuration and Key Decisions

### 1. Relative Import Paths

- **Removed all `@` and non-relative import aliases** (e.g. `@core/utils`) and switched to **strict relative paths** (e.g. `../../utils/logger`).
- This was **critical to make modules portable**, enabling them to work in isolated environments without relying on monorepo-style path mappings.

### 2. `tsconfig.json` Adjustments

The following `tsconfig.json` options were crucial to the success of the POC:
```json
{
  "target": "es2022",
  "module": "commonjs",
  "esModuleInterop": true
}
```

    "target": "es2022" enabled modern JavaScript features.

    "module": "commonjs" ensured compatibility with require() and older Node.js tools and packages.

    "esModuleInterop": true helped with default imports from CommonJS modules.

## 🧱 Packages Downgraded to CJS-Compatible Versions

To ensure compatibility with the CommonJS environment, several ESM-first packages were downgraded to versions that supported require():
Package	Downgraded To
zx	^6.0.0
chalk	^4.1.2
inquirer	^8.2.4
inquirer-autocomplete-prompt	^2.0.0

These versions ensure that the CLI can run without throwing ESM-specific errors.

## ⚠️ Challenges Overcome
1. Import/Export Incompatibility

    Encountered dynamic import() issues due to mixing ESM-style file:// paths with require().

    Resolved by consistently using require() throughout and adjusting import paths accordingly.

2. Module Resolution Errors

    Relative path resolution required strict handling of file extensions and avoidance of ESM-only patterns.

    Resolved by appending .js extensions during dynamic resolution and using path.join() intelligently.

3. CLI Entry Script Compatibility

    Needed to ensure CLI entry file could require() all downstream logic without hitting top-level await or import.meta.url ESM errors.

## ✅ Recommendation
1. Preserve the Working POC

    The current cd-cli works and serves as a stable reference point.

    It provides a reliable basis to bootstrap isolated Corpdesk modules using CommonJS.

2. Start Parallel ESM Migration

    With the concept proven, we can now attempt a second track: making an ESM-compliant version of cd-cli.

    This will involve:

        Converting all imports to import/export

        Replacing require() with dynamic import()

        Adjusting tsconfig.json and package.json to ESM mode

        Upgrading zx, chalk, inquirer, etc. to modern ESM-friendly versions

    The ESM version should follow the same architecture but use ESM-native idioms.

## 🚀 Next Steps

    Tag and archive the working CJS-based implementation (e.g. v0.1.0-cjs).

    Branch out into a new esm-migration branch for progressive conversion.

    Create a migration checklist to track ESM conversion module by module.

    Gradually test compatibility for ESM packages as we move to the modern toolchain.

## 💬 Final Thoughts

The CJS-based cd-cli is a strong foundational POC for Corpdesk's CLI module system. Despite limitations in backward compatibility, it unlocks modularity, runtime extensibility, and a scalable developer experience. The next frontier is achieving the same flexibility using modern, forward-looking ESM standards.