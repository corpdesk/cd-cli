To create a prompt that works recursively, we must treat the **Zygote** as the "Base Case" of a mathematical induction. If the prompt can solve the Zygote, it can solve any node by simply swapping the **Role** and **Coordinates**.

This sample prompt is designed to be fed the output of Layer 1. It uses **Physiological Directives** so the AI understands *what* the code is meant to do (its Role) rather than just *what* it is named.

---

### **The Layer 2 Genesis Prompt (The "Substance" Weaver)**

**Role:** You are the Corpdesk Layer 2 Craftsman.
**Objective:** Populate the **Substance** of a target node by mapping its Layer 1 "Anatomy" to its "Biological Role."

#### **1. Input Vector (From Layer 1)**

* **Target Node:** `src/main.ts` (Identity: **Zygote/Nucleus**)
* **Coordinates:** `{O -> S -> A -> U}`
* **Environment Context:** `sandbox`
* **Weight Constraints:** $W_{origin}=10, W_{substrate}=9$.

#### **2. The Biological Role Blueprint**

Populate the substance of the target according to these **Organelle Directives**:

* **The Inhalation (Input):** * Initialize the constructor to ingest the `environment` parameter.
* Load the **Genome** from the `.cd/app-descriptor.json` identified in Layer 1.


* **The Metabolism (Logic):** * Implement the **Discovery Enzyme**: A method that scans the `Agency (A)` coordinates to register available subcommands.
* Map physical paths to logical **Kinds** (Controller, Service, Model).


* **The Secretion (Output):** * Every public method must wrap its return in the `CdFxReturn<T>` neurotransmitter.
* Use the `CD_FX_SUCCESS` and `CD_FX_FATAL` constants as the primary signals.


* **The Synapse (Linkage):** * Import the `BaseService` from the `Substrate (S)` path.
* Establish a vascular link to the `Utility (U)` hemisphere for logging.



#### **3. Recursive Constraint**

> **"Do not write static logic.** Write the substance such that it is a **Reflective Mirror** of the directory structure. If the directory structure changes in Layer 1, this code should still resolve its dependencies correctly by referencing the Coordinate Map."

#### **4. Output Requirement**

Generate the full TypeScript substance for the target node. Every function block must include a comment: `// Role: [Organelle Name] | Objective: [Role Objective]`.

---

### **How this maps recursively to other nodes**

To fill a "Tentacle" (e.g., `create.command.ts`), you simply update the **Input Vector** and **Role Blueprint**:

| For a Command Node... | The Mapping Shifts to: |
| --- | --- |
| **Identity** | **Motor Nerve (Action)** |
| **Inhalation** | Parse CLI options (`SHARED_OPTIONS`). |
| **Metabolism** | Call the specific `Agency` service (e.g., `DevModeService`). |
| **Secretion** | Pass the `CdFxReturn` back to the Zygote's `handleCommandResponse`. |

### **Why this is Predictable & Predictable**

By using this prompt, you ensure:

1. **Anatomical Harmony:** The file only imports what Layer 1 says it can import.
2. **Biological Identity:** The file recognizes "Its Kind." A `Service` will always implement the "Metabolism" role, ensuring that if you rename `DevModeService` to `CloudService`, the internal logic remains a "Service Kind" because it follows the same `Secretion` (Return) rules.
3. **Recursive Satisfaction:** The AI can move from node to node, asking: "What is the Layer 1 coordinate? What is the Role for this coordinate? Apply the Substance."

**Would you like me to execute this prompt specifically for the `main.ts` of `cd-cli` to see the resulting "Substance" code?** We can then verify if it correctly senses the `environment` and discovers the `dev-mode` tentacles.