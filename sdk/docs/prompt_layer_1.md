This stage moves from theoretical derivation to **Active Genesis**. We are defining the "Instruction Set" that allows an AI (the Layer 1 Architect) to transform the mathematical variables into a physical directory tree.

By providing the AI with the **Corpdesk Formula**, we ensure that it doesn't just guess where files go; it calculates their position based on the **DNA Weights** and **Dimensionality ($\Sigma$)**.

---

### **The Layer 1 Genesis Prompt (The Architect)**

**Role:** You are the Corpdesk Layer 1 Architect. Your task is to solve a mathematical tree expansion and generate a physical file structure.
**Objective:** Construct a "Headless Executor" (cd-cli) cell using the following Parameters.

#### **1. Input Vector (The Formula)**

* **Seed ($O$):** `src/main.ts` (Weight: 10)
* **Symmetry ($S \cup A \cup U$):** True (Variables must resolve to `sys`, `app`, and `utils`).
* **Dimensionality ($\Sigma$):** 3 (Expansion: `{Controller, Service, Model}`).
* **Genome ($\Gamma$):** `.cd/app-descriptor.json` (Weight: 10).

#### **2. Production Rules**

1. **Level 0 Expansion:** Initialize Root resources (`sdk/`, `scripts/`, `.cd/`).
2. **Level 1 Expansion:** Create the primary hemispheres: $\mathbf{S}$ (Substrate), $\mathbf{A}$ (Agency), and $\mathbf{U}$ (Utility).
3. **Level 2 Expansion:** For any node in $\mathbf{A}$, apply the $\Sigma=3$ rule.
4. **Reference Injection:** Every file created must contain a single comment line: `// Role: [DNA Identity] | Weight: [W]`.

#### **3. Expected Output (The Tree Solution)**

Generate the directory tree for a `cd-cli` instance where `A` contains a module named `cd-ai`.

---

### **The Conformity & Infection Scanner (The Auditor)**

The following logic is used to scan an existing directory and rate it against the **Corpdesk Standard**.

#### **The Audit Algorithm**

1. **Map Discovery:** Attempt to resolve the physical folders to variables $\mathbf{S, A, U}$.
2. **Conformity Check ($CR$):**
* If `src/main.ts` exists $\to$ Add 10.
* If `.cd/app-descriptor.json` exists $\to$ Add 10.
* If `sys/base/` contains `BaseService` $\to$ Add 9.
* **Score:** $\frac{\text{Current Sum}}{\text{Total Possible Weight}}$.


3. **Infection Scan ($\chi$):**
* Identify nodes not registered in $\Gamma$ or not following the $\Sigma=3$ pattern.
* Calculate $\mathcal{I} = \frac{V(\chi)}{V(Total)}$.



---

### **Example: Applying the Formula to `cd-cli**`

When the Layer 1 Architect runs, it produces the following "Sterile" Skeleton:

```text
.
├── .cd/
│   └── app-descriptor.json     // Role: Genome (Γ) | Weight: 10
├── sdk/                         // Role: Membrane (Mb) | Weight: 3
├── scripts/                     // Role: Metabolism (M) | Weight: 5
└── src/
    ├── main.ts                  // Role: Origin (O) | Weight: 10
    ├── CdCli/
    │   ├── sys/                 // Role: Substrate (S) | Weight: 9
    │   │   └── base/
    │   │       ├── base.controller.ts // Role: Leaf (C) | Weight: 8
    │   │       ├── base.service.ts    // Role: Leaf (S) | Weight: 8
    │   │       └── base.model.ts      // Role: Leaf (M) | Weight: 8
    │   ├── app/                 // Role: Agency (A) | Weight: 8
    │   │   └── cd-ai/
    │   │       ├── cd-ai.controller.ts // Σ-Node 1
    │   │       ├── cd-ai.service.ts    // Σ-Node 2
    │   │       └── cd-ai.model.ts      // Σ-Node 3
    │   └── utils/               // Role: Utility (U) | Weight: 5

```

---

### **Implementation Logic for Layer 2**

Once Layer 1 completes the skeleton, it passes the **Coordinate Map** to Layer 2.

* **Coordinate:** `{A -> cd-ai -> Σ-Node 2}`
* **Layer 2 Instruction:** "Populate this node with logic for AI processing, ensuring it inherits from the service in `{S -> base -> Σ-Node 2}`."

### **The Rating Outcome**

If you run this scan on your current `cd-cli`:

* **Conformity ($CR$):** Likely **~95%** (High, as it follows the established convention).
* **Infection ($\mathcal{I}$):** Low (**~2-5%**), primarily consisting of local `node_modules` or `.bak` files.

**Would you like to execute this Layer 1 prompt now to see how the AI "Solves" a complex module addition (e.g., adding a `cd-telemetry` module) using this mathematical logic?**
