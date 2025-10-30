Refined **RFC-0005: Corpdesk PWA Menu and Controller Lifecycle**, including explicit cautions and technical details.

-----

# Corpdesk Standard Development Architecture (RFC-0005)

## Corpdesk PWA Menu and Controller Lifecycle

### Document Version: RFC-0005

Last Edited: October 29, 2025
Author: Oremo Ojwang, george.oremo@gmail.com
Status: Draft

-----

## 1\. Introduction

This standard defines the **Controller Lifecycle** within the **`cd-pwa`** application type, specifically addressing the dynamic loading of views from the menu system. It formalizes the use of **State Preservation** through controller caching, eliminating the need for full controller re-initialization on view changes.

This model is crucial for enabling features like navigation history (Go Back/Forward) and maximizing frontend performance.

-----

## 2\. Core Concepts and Terminology

| Term | Definition |
| :--- | :--- |
| **Controller Lifecycle** | The sequence of prescribed methods (`__setup`, `__deactivate`, `__activate`) invoked when a controller's view is loaded or unloaded from the DOM. |
| **Lazy Initialization** | The controller's core dependencies and state are initialized only **once** via `__setup()`, at the first request. |
| **State Preservation** | The controller instance and its data remain in memory (`ControllerCacheService`) when its view is removed. |
| **`ControllerCacheService`** | The singleton service responsible for storing initialized controller instances and enforcing the single-execution rule for `__setup()`. |

-----

## 3\. The New Controller Lifecycle API

### 3.1 `async __setup()` (Persistent Initialization - Run **Once**)

  * **Purpose:** Initializes controller state and dependencies that **persist in memory** across view changes (e.g., form state, service instances).
  * **Content:**
      * Initialize services (`this.svX = new XService();`).
      * Initialize framework components (`this.form = new CdFormGroup(...)`).
  * ⚠️ **CAUTION (DO NOT):** Perform any DOM lookups, attach event listeners, or instantiate the `CdDirectiveBinderService` here. Defer these actions to `__activate()`.

### 3.2 `__deactivate()` (Transient Cleanup - Run on **View Removal**)

  * **Purpose:** Cleans up temporary resources when the controller's view is about to be replaced.
  * **Content:**
      * Call `this.binder.unbindAllDomEvents()` to remove all DOM event listeners.
      * Remove any manually added DOM listeners (e.g., custom form submit handlers).
      * **DO NOT:** Clear persistent state (`this.form` or service instances).

### 3.3 `async __activate()` (DOM Attachment - Run on **View Insertion**)

  * **Purpose:** Re-establishes the connection between the persistent controller state and the newly rendered DOM.
  * **Content:**
      * **Instantiate Binder:** Check if `this.binder` is null. If so, instantiate the `CdDirectiveBinderService` here, as the HTML template is now guaranteed to be in the DOM.
      * Call `this.binder.bindToDom()` to find new DOM elements and re-attach all listeners, applying current form state.
      * Add any required view-specific listeners (e.g., form submit if not using event directives).
      * Perform any necessary UI actions (e.g., set initial focus).

-----

## 4\. `ControllerCacheService`

The `ControllerCacheService` uses a unique key—the `item.route`—to manage the cache entry for each controller.

### Technical Detail: Cache Key Selection

The cache key must be unique per view, not just per module. This prevents controllers within the same module (e.g., `/cd-user/sign-in` and `/cd-user/sign-up`) from sharing the same state.

```mermaid
graph TD
    A[loadResource(item)] --> B{Cache Hit? - Key: item.route};
    B -- Yes --> C[Return Cached Instance];
    B -- No --> D[Create New Instance];
    D --> E[AWAIT instance.__setup()];
    E --> F[Cache Instance (using item.route as key)];
    F --> G[Return New Instance];
```

-----

## 5\. Lifecycle Sequence Diagrams

The diagrams remain accurate, but emphasize the timing of the Binder instantiation:

*(Sequence Diagrams omitted for brevity, refer to original RFC-0005 for diagrams)*

-----

## 6\. `CdDirectiveBinderService` Implementation Rules

The Binder is the primary source of the "Activation Race Condition" if implemented incorrectly.

| Method | Role in Lifecycle | Critical Requirement |
| :--- | :--- | :--- |
| **`constructor(...)`** | Runs once during Lazy Initialization (`__setup()` or first `__activate()`). | **MUST ONLY store** the `formSelector` (e.g., `#settingsForm`) and controller instance. It **MUST NOT** execute `document.querySelector`. |
| **`unbindAllDomEvents()`** | Executes during `__deactivate()`. | Removes all stored listeners and clears the internal tracking array. |
| **`bindToDom()`** | Executes during `__activate()`. | **MUST** execute `this.formElement = document.querySelector(this.formSelector)` to locate the form and proceed with binding/state application. |

-----

## 7\. Implementation Guidelines

### 7.1 Controller Instantiation

Controller instances must be retrieved exclusively via `ControllerCacheService.getOrInitializeController(...)`. Developers must **never** manually instantiate a controller that is part of the menu system.

### 7.2 Asynchronous Operations

Both `__setup()` and `__activate()` are `async`. Any method calling them **must** use `await` to ensure the asynchronous initialization/cleanup is complete before proceeding (e.g., before injecting new HTML or setting the active controller).

### 7.3 Common Pitfall: The Activation Race Condition

The most common failure pattern is instantiating the `CdDirectiveBinderService` inside the controller's `__setup()` method.

**Reason for Failure:** The `ControllerCacheService` calls `__setup()` *before* the `MenuService` has injected the view's HTML template into the DOM.

| Phase | Action | Result |
| :--- | :--- | :--- |
| **Setup** | `__setup()` calls `new CdDirectiveBinderService(...)` | Fails, as `document.querySelector('#formId')` returns null. |
| **Activate**| `__activate()` calls `binder.bindToDom()` | Fails, as the binder's `formElement` was permanently set to null in the constructor. |

**The Mandatory Fix:** The `CdDirectiveBinderService` must be instantiated in the controller's `__activate()` method, ensuring the controller is ready to execute its core DOM interaction logic when the view is visible.

-----

## 8\. Conclusion

RFC-0005 establishes a robust, state-preserving controller lifecycle for Corpdesk PWAs. By strictly separating persistent initialization (`__setup()`) from transient DOM attachment (`__activate()`) and cleanup (`__deactivate()`), we ensure high performance, prevent memory leaks, and stabilize the system against activation race conditions, forming the architectural foundation for advanced navigation features and intelligent automation tooling.