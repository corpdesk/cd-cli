# Corpdesk Changelog

## [0.5.0-uud-alpha] – 2025-10-29

### 🚀 Added
- **UUD Controller Lifecycle**
  - Introduced mandatory lifecycle methods `__activate()` and `__deactivate()` for all controllers.
  - These ensure deterministic setup, teardown, and reactivation of controllers at runtime.
  - Lifecycle designed per **Corpdesk RFC-0005** (published under `sdk/docs/corpdesk-rfc-0005.md`).

- **ControllerCacheService**
  - New runtime cache layer managing controller persistence.
  - Controllers retain state between route navigations, minimizing re-renders.
  - Enables PWA-style live reactivation and deactivation without memory leaks.

- **UUD Directive Engine**
  - Added Angular-style directive binding support `(change)="method($event)"`.
  - Fully integrated into the new lifecycle model — bindings attach in `__activate()` and clean up in `__deactivate()`.
  - Powers truly reactive form controls without any framework overhead.

- **UI Configuration Demo**
  - `cd-admin-settings` module now dynamically applies:
    - UI System (Material, Bootstrap)
    - Theme (Default, Dark)
    - Form Variant (Standard, Compact, Floating)
  - Demonstrates complete live reactivity under the new UUD lifecycle model.

### ⚙️ Improved
- `CdDirectiveBinderService` now accepts controller instance context, enabling scoped directive execution.
- `CdAdminSettingsController` upgraded to full UUD compliance with isolated lifecycle and live change binding.
- Lifecycle-safe event attachment ensures no duplicate listeners after reactivation.

### 🧠 Architectural Highlights
- This release marks the **foundation of UUD (Universal UI Directives)** for Corpdesk.
- Demonstrates an Angular-equivalent experience with **zero framework weight**.
- Provides full control over lifecycle timing, event binding, and controller caching.
- Designed to remain compatible with **runtime module federation** — something not feasible under Angular’s compiler model.

### 🧑‍💻 Contributors
- **George Oremo (EMP Services Ltd)** — architecture, RFC authoring, UUD design, and implementation validation.

---

*Milestone: UUD Alpha — establishing the new directive engine and controller lifecycle for next-generation Corpdesk PWA.*
