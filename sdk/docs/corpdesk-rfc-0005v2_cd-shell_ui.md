Perfect — I will now generate the **full, polished RFC-0005** with the “Scripted Button → Bootstrap Output” example placed in **Section 8: Appendix A — Transformation Examples**, as you selected (option **2**).

This document will be:

* Fully structured as a formal Corpdesk RFC
* Written in clean Markdown
* Contain diagrams (ASCII-style that render well in Markdown)
* Include the complete end-to-end architecture for:

  * runtime UI system detection
  * SysCacheService eager-loading
  * ui-bridge
  * adaptor-port adaptors
  * ui-systems & themes
  * hot switching
  * generic HTML → UI-system-specific output
* Include a **launch sequence diagram**
* Include the **button example** you requested.

Here is the complete RFC:

---

# **Corpdesk RFC-0005: Runtime Caching and UI System Integration**

**Title:** Corpdesk RFC-0005: Runtime Caching and UI System Integration
**Updated:** 22 Nov 2025
**Author:** Oremo Ojwang – EMP Services Ltd
**Status:** Draft for Implementation
**Applies To:** `cd-shell`, `ui-systems`, `ui-adaptor-port`, `cd-guig`, runtime theming, bridge layer

---

# **1. Motivation / Rationale**

Modern Corpdesk installations require:

* Multiple UI systems (Bootstrap, Material, Plain, Tailwind)
* Multiple themes per UI system (default, dark, custom)
* Ability for **runtime switching** with **no page reload**
* Generic HTML that does **not depend** on any specific CSS framework
* Predictable developer experience where a developer can write:

```html
<button cdButton>Sign In</button>
```

…and the system transforms it into:

* Bootstrap: `<button class="btn btn-primary">Sign In</button>`
* Material:  `<button class="mdc-button mdc-button--raised">Sign In</button>`
* Plain:     `<button class="cd-plain-button">Sign In</button>`

### Why This RFC Exists

Over time, Corpdesk accumulated:

* duplicate logic
* UI-specific code mixed into views
* theme logic mixed into UI loading logic
* external CSS frameworks overriding local HTML unexpectedly

This RFC unifies *all* UI-system logic into a clean, layered architecture that:

* caches all UI-system + theme descriptors at launch
* loads the correct css/js + bridge layer
* activates the correct adaptor
* lets any generic HTML be interpreted under the active UI system
* allows user or admin to switch UI systems or themes dynamically

---

# **2. Architectural Overview**

```
┌──────────────────────────────────────────────────────────────┐
│                        Application Shell                      │
│     (cd-shell boot sequence, SysCacheService, uiConfig)       │
└──────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│                       SysCacheService                         │
│  - Loads uiConfig, uiSystems, themes, variants, descriptors   │
│  - Stores normalized data for runtime                         │
└──────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────┐       ┌──────────────────────────┐
│   UiSystemLoaderService    │ ----> │   UiThemeLoaderService   │
│   - Loads CSS/JS           │       │   - Loads theme CSS/JS   │
│   - Loads bridge.css       │       │   - Applies theme vars   │
│   - Activates adaptor      │       │                          │
└────────────────────────────┘       └──────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│                      ui-adaptor-port                          │
│   (bootstrap-538-adapter, plain-adapter, material-adapter)    │
│   - Translates conceptual DOM (button,input,formGroup)        │
│   - Injects UI-specific classes/attributes                    │
└──────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│                      UI Bridge Layer                          │
│     - bridge.css normalizes baseline layout                   │
│     - bridge.adapter.js applies DOM rewrites                  │
└──────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────┐
│                  Final Browser Rendering                      │
│   generic HTML → transformed into UI-framework-specific HTML  │
└──────────────────────────────────────────────────────────────┘
```

---

# **3. Design Principles**

### **1. Generic HTML**

All views, controllers, and auto-generated forms must use generic HTML.

Example:

```html
<input cdInput name="username">
<button cdButton>Sign In</button>
<div cdCard>...</div>
```

No UI-system classes should appear in source HTML.

---

### **2. UI System Descriptors**

Each UI system provides:

* css/js entrypoints
* theme definitions
* conceptual class-mappings
* adaptor class name

Example:

```json
"conceptMappings": {
  "button": { "class": "btn btn-primary" },
  "input": { "class": "form-control" },
  "card":  { "class": "card" }
}
```

---

### **3. Adaptor-Port Layer**

Each adapter:

* receives the descriptor
* converts conceptual HTML elements
* applies classes, custom attributes, theme rules

---

### **4. Bridge Layer**

`bridge.css` ensures:

* typography normalization
* buttons respect theme variables
* forms have consistent spacing
* dark/light mode values always present

`adapter.js` ensures:

* DOM mutations
* dynamic class rewrite

---

### **5. Runtime Switchability**

Switching UI systems:

```
SysCacheService.getUiSystems() → user selects → UiSystemLoaderService.activate(id)
```

Switching themes:

```
SysCacheService.getThemes() → user selects → UiThemeLoaderService.applyTheme(id)
```

Both occur without reload.

---

# **4. Launch Sequence Diagram**

```
User opens /sign-in
        │
        ▼
┌───────────────────────────┐
│ ConfigService.loadConfig()│
└───────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ SysCacheService.loadAndCacheAll()        │
│  - loads uiConfig                        │
│  - loads available ui-systems            │
│  - loads available themes                │
│  - stores normalized descriptors          │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│ UiSystemLoaderService.activate(systemId) │
│  - detect fallback id                    │
│  - load css/js                           │
│  - load bridge.css                       │
│  - load adapter                          │
│  - call adapter.activate()                │
└──────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────┐
│ UiThemeLoader.applyTheme(activeThemeId)    │
│  - load theme stylesheets                  │
│  - set CSS variables                       │
│  - notify adaptor                          │
└────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────┐
│ CdDirectiveBinder + UI Bridge              │
│ transforms generic DOM → UI-specific DOM   │
└────────────────────────────────────────────┘
        │
        ▼
   Final Render
```

---

# **5. Key Components**

## 5.1 SysCacheService

Responsibilities:

* Load configuration
* Normalize system + theme descriptors
* Provide fast in-memory access
* Ensure availability before first view loads

A single global instance is shared across runtime.

---

## 5.2 UiSystemLoaderService

Handles:

* auto-detection
* loading system css/js
* loading bridge.css
* loading adapter.js
* activating the adaptor

---

## 5.3 UiThemeLoaderService

Handles:

* injecting theme CSS
* loading theme scripts
* applying theme variables
* notifying adaptor

---

## 5.4 UI Bridge

* `bridge.css` → normalizes base layout
* `bridge.adapter.js` → performs DOM rewrites where needed

Examples:

* Ensures inputs match theme spacing
* Ensures buttons use (--bs-primary) or similar
* Ensures dark/light text contrast

---

## 5.5 ui-adaptor-port Adaptors

Adaptors such as:

```
bootstrap-538-adapter.service.ts
material-design-adapter.service.ts
plain-adapter.service.ts
```

Each adaptor implements:

```ts
interface IUiSystemAdapter {
  activate(descriptor: UiSystemDescriptor): Promise<void>;
  deactivate(): Promise<void>;
  applyTheme(themeDescriptorOrId: any): Promise<void>;
}
```

And optional conceptual mapping helpers.

---

# **6. Generic HTML → UI System Output**

This is the core promise made to developers:

> **Write once. Render under any UI system.**

Example:

```html
<button cdButton>Sign In</button>
```

The bridge identifies:

* element type = `button`
* directive = `cdButton`
* active ui-system = Bootstrap 5.3.8
* active theme = default/dark

Then it uses:

```
descriptor.conceptMappings.button.class
```

Result:

```html
<button class="btn btn-primary">Sign In</button>
```

For Material:

```html
<button class="mdc-button mdc-button--raised">Sign In</button>
```

For plain:

```html
<button class="cd-button">Sign In</button>
```

---

# **7. Hot-Switching UI Systems and Themes**

Changing UI system (example: Bootstrap → Material):

```
UiSystemLoaderService.activate("material-design")
→ unload bootstrap css/js
→ load material css/js
→ apply material adaptor
→ reconvert DOM (bridge + binder)
```

Changing theme (example: light → dark):

```
UiThemeLoaderService.applyTheme("dark")
→ load dark.css
→ update CSS variables
→ adaptor.applyTheme()
```

Both occur with *no reload*.

---

# **8. Appendix A — Transformation Examples**

### **Example 1 — Button**

### **Input (generic developer-written HTML)**

```html
<button cdButton>Sign In</button>
```

### **Active UI System:** `bootstrap-538`

### **Active Theme:** `default`

### **Output after bridge + adaptor**

```html
<button class="btn btn-primary">Sign In</button>
```

---

### **Example 2 — Input Field**

**Input:**

```html
<input cdInput name="email">
```

**Bootstrap Output:**

```html
<input class="form-control" name="email">
```

---

### **Example 3 — Card / Form Group**

**Input:**

```html
<div cdCard>
  <p>Hello</p>
</div>
```

**Bootstrap Output:**

```html
<div class="card">
  <div class="card-body">
     <p>Hello</p>
  </div>
</div>
```

(adaptor expands card-body wrapper)

---

### **Example 4 — Dark Mode**

Active theme descriptor:

```json
{ "id": "dark", "mode": "dark" }
```

Bootstrap adaptor outputs:

```html
<html data-bs-theme="dark">
```

---


