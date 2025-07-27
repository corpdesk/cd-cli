# Introducing Self-Test Capability in Descriptors Architecture

## Overview

The introduction of a **self-test** capability directly within the `CiCdDescriptor`, implemented through the `CICdTask` interface, establishes a foundation for standardized, automated validation of module behavior. This aligns Corpdesk with modern DevOps and CI/CD practices while integrating tightly with internal descriptor-driven development principles.

## Concept and Purpose

By embedding a self-contained test capability as a valid `CiCdTask`, modules can declare and run their own validation routines. These routines:

* Are defined as first-class `CICdTask` entries
* Run within existing workflows
* Can verify the integrity, correctness, and compliance of a module against known Corpdesk standards

This approach supports version-aware testing, documentation generation, and changelog management, enhancing traceability and robustness.

## Key Interfaces and Structures

### 1. `CICdTask` Interface

```ts
export interface CICdTask<T = any> extends CdSchedulerTask<T> {
  type: 'script-inline' | 'script-file' | 'method' | 'cdRequest';
  status: 'pending' | 'running' | 'completed' | 'failed';
  completionRef?: string;
}
```

### 2. Self-Test as `cdRequest`

A task of type `cdRequest` can be used to execute test logic. It includes:

```ts
cdRequest?: ICdRequest; // Executes a backend method with known input/output
```

This makes the test callable, structured, and integrable into the CI/CD workflow.

## Relationship with Versioning Artifacts

### 1. Roadmap Integration

Self-tests can reference and validate items from the roadmap. By tracking roadmap objectives against tested outputs, Corpdesk can:

* Confirm alignment with planned features
* Automatically mark completed tasks
* Flag regressions in workflows

### 2. changelog.json & doc.json Automation

Upon running the self-test:

* **`changelog.json`** can be auto-updated with the results of changes tested
* **`doc.json`** can capture tested behaviors and method signatures

This ensures testing and documentation evolve together.

## Execution and Conformance

To ensure focus, self-tests are:

* Constrained to return `CdFxReturn<T>`
* Encouraged to use boolean or semantic `CdFxStateLevel` for state

### Example `CdFxReturn` Standard:

```ts
export interface CdFxReturn<T> {
  data?: T | null;
  state: boolean | CdFxStateLevel;
  message?: string | null;
}
```

### `CdFxStateLevel` Enum:

```ts
export enum CdFxStateLevel {
  Success = 1,
  Error = 0,
  PartialSuccess = 2,
  // ... others
}
```

This encourages alignment with expected system semantics and facilitates simple, portable interpretation.

## Developer Constraints and Simplification

To preserve consistency:

* Self-tests must adhere to standard `CdFxReturn<T>` format
* Assertions use simplified `ICdAssert` logic, constrained to known Corpdesk types
* Developers supply only:

  * Input (if needed)
  * Expected output/state
  * Target method reference via `cdRequest`

This allows test authors to focus on intent, while the platform enforces structure and integration.

## Integration of 'assert' Property for self testing:

Integration into the CiCdTask:
🔁 Proposal: Add assert as a Parallel Executable Request
```ts
export interface BaseSchedulerTask<T = any> extends BaseDescriptor {
  name: string;
  type: string;
  executor: ExecutionEnvironmentType;
  input?: T;
  status?: string;
  cdVault?: CdVaultItem[];

  script?: string;
  scriptFile?: string;
  className?: string;
  methodName?: string;
  cdRequest?: ICdRequest;

  /**
   * Executable request that checks/asserts if the outcome of this task is valid.
   * If provided, the result can be used to validate or gate the transition of the task.
   */
  assert?: ICdRequest; // ← Executable assertion/test for this task

  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
}

```

✅ Sample CICdTask with assert in Context

```ts
const createRepoTask: CICdTask = {
  name: 'createRepository',
  type: 'method',
  executor: 'cd-cli',
  status: 'pending',
  cdRequest: {
    ctx: 'app',
    m: 'cd-auto-git',
    c: 'CdAutoGit',
    a: 'createGitHubRepoOctokit',
    dat: {
      f_vals: [],
      token: '<token>',
    },
    args: {
      repoName: 'abcd',
      repoHost: 'corpdesk',
      isPrivate: true,
    },
  },
  assert: {
    ctx: 'app',
    m: 'cd-auto-git',
    c: 'CdAutoGit',
    a: 'checkIfRepoExists',
    dat: {
      f_vals: [],
      token: '<token>',
    },
    args: {
      repoName: 'abcd',
      repoHost: 'corpdesk',
    },
  },
  onResult: [
    {
      ifState: [CdFxStateLevel.Success],
      toTask: 'initializeReadme',
    },
    {
      ifState: [CdFxStateLevel.SystemError, CdFxStateLevel.Fatal],
      toTask: 'notifyFailure',
    },
  ],
};

```

📚 Relation to Documentation and History

With assert added, you can:

    Generate a workflow by transforming each roadmap item (task) into executable and testable steps.

    Reverse engineer a roadmap from any complete workflow — including test results.

    Auto-generate documentation from the tasks by introspecting cdRequest + assert → you know:

        What action was taken,

        What was tested,

        The expected outcome.

    Update the changelog by recording success/failure of the assert.

🧠 Suggested Abstracted Behavior
```ts
function executeTask(task: CICdTask): Promise<ExecutionResult> {
  await executeCdRequest(task.cdRequest);
  const result = await executeCdRequest(task.assert);
  return evaluateResult(result);
}

```
This can fit into cd-shell, cd-ai, or cd-cli as a universal verifier.

🧠 Assertion as a Strategic Capability, Not a Default Behavior

    1. The Role of assert in CICdTask
    The assert field serves as a declaration of testability, not a trigger for execution.
    It says: “If this task is executed under test conditions, here’s how its outcome should be validated.”

    2. Test Execution as an Explicit Operation

        By default, tasks execute according to their type: cdRequest, script, method, etc.

        When a test command (e.g., run --test, cd-cli test, or part of ci:check) is invoked, the framework:

            Executes the cdRequest

            Evaluates the assert based on the CdFxReturn<T> output

            Captures and logs the outcome in a format consistent with corpdesk logs

    3. Workflow Maturity Model

        Developers (or AI) iterate over tasks while refining the workflow.

        Once a stable state is reached, they can attach an assert to that task for formal verification.

        The test can now be triggered on demand (test mode), not automatically.

    4. Strategic Application Modes

        --test: Executes the task + assertion

        --create --test: Combines creation and validation

        --verify: Re-runs all assert-equipped tasks in a workflow

        --audit: Could run all asserts across a roadmap, producing a semantic summary (e.g., success rates by state)

    5. Automated Recordkeeping

        If a test passes:

            The roadmap can be marked as covered

            A changelog entry is generated describing the outcome

            The doc.json is updated to reflect successful use cases and behavioral expectations


## 📘 Corpdesk Descriptor Architecture: Integrating Function-Level Assertions
🔹 Background

In the Corpdesk framework, every method/function defined under a component such as a service or controller is represented via the FunctionDescriptor. This descriptor now includes an optional assert field designed to:

    Allow each function to declare its own test case.

    Seamlessly integrate with the roadmap, changelog, and documentation systems.

    Support test-driven workflows for both developers and AI contributors.

🔹 Key Interfaces
CdServiceDescriptor

## A descriptor for service-level components:

```ts
export interface CdServiceDescriptor extends ComponentDescriptor {
  type: 'service';
  parentController?: string;
}
```

## ComponentDescriptor

The shared interface for all components (controllers, services, models, etc.):

```ts
export interface ComponentDescriptor extends BaseDescriptor {
  name: string;
  type: ComponentType;
  module?: string;
  parent?: string;
  fileName?: string;
  attributes?: ComponentAttributes[];
  methods?: FunctionDescriptor[];
  classSignature?: ClassSignatureDescriptor;
  dependencies?: DependencyDescriptor[];
  traits?: string[];
  view?: ViewModelDescriptor;
}
```

## FunctionDescriptor

Describes a method/function including its optional test definition:

```ts
export interface FunctionDescriptor extends BaseDescriptor {
  scope: ScopeDescriptor;
  parameters?: ParameterDescriptor[];
  output?: OutputDescriptor;
  typeInfo?: TypeInfoDescriptor;
  behavior?: BehaviorDescriptor;
  annotations?: AnnotationsDescriptor['annotations'];
  apiInfo?: ApiInfoDescriptor;
  documentation?: DocumentationDescriptor;
  miscellaneous?: MiscellaneousDescriptor;
  isDefault: boolean;
  assert?: ICdRequest; // Optional assertion logic for testing
}
```

🔹 Purpose of assert?: ICdRequest

    Indicates a function is testable, not necessarily tested.

    The presence of assert allows:

        Auto-generation of test workflows.

        Integration into roadmap → changelog → documentation pipelines.

        Declarative test behavior (e.g., --test flag triggers validation).

🔹 Use Case Scenarios

    A developer or AI agent configures a method with an assert test case.

    During workflow stabilization, the developer decides to run:

```
    > cd-cli test my-method
```

    If the assert passes:

        The roadmap entry is marked ✅

        changelog.json is updated with successful result

        doc.json gets enriched with the outcome

        Optionally triggers auto-increment of version (e.g., patchLevel)

    Other possibilities:

        > cd-cli create my-method --test: create and immediately test.

        Auto-discovery of all methods with assert for batch testing.

🔹 Benefits

    Empowers each function with embedded self-awareness.

    Bridges execution with documentation, changelog, and semantic tracking.

    Enhances AI-guided development, where reasoning and validation are co-located.



## Summary Insight

Rather than forcing all tasks to validate themselves, Corpdesk embraces intentional testing, with the assert field acting as a self-test contract. This maintains purity of execution logic while providing hooks for automated CI/CD intelligence — a blend of optionality, simplicity, and powerful traceability.

🔁 Automated Semantic Versioning Based on Test Results

Your current autoPatchLevel concept (already working) is the foundation. From there, we can naturally introduce:
✅ 1. Auto-Increment: Patch Level (already implemented)

    Triggered when a minor fix or update passes its test.

    Only patchLevel (x.y.z) increases.

    Example: 1.0.4 → 1.0.5

📈 2. Auto-Increment: Minor Level

    Triggered when a testable task:

        Introduces new but backward-compatible features

        Has assert and passes successfully

    Increments minor (x.y.0), resets patch.

    Example: 1.4.7 → 1.5.0

Criteria to detect it:

    New CiCdTask type like feature

    Roadmap entry type is marked as FeatureAddition

    Or: developer/AI explicitly uses --minor

🚀 3. Auto-Increment: Major Level

    Triggered when:

        A breaking change is tested and verified

        A new major feature invalidates older contracts

    Increments major (x.0.0), resets minor and patch.

    Example: 2.3.4 → 3.0.0

Detection strategy:

    Task explicitly marked with a breaking flag or impactLevel: 'major'

    Test passes successfully

    Could also use --major flag in CLI

## 🧩 Suggested Version Bump Design Logic

| Criteria                           | Version Change   | Trigger Type                              |
| ---------------------------------- | ---------------- | ----------------------------------------- |
| Code change + no test              | No bump          | Manual or non-test update                 |
| Passed test (bugfix/safe update)   | Patch (`+0.0.1`) | Auto                                      |
| Passed test (new feature)          | Minor (`+0.1.0`) | Auto or `--minor`                         |
| Passed test (breaking or overhaul) | Major (`+1.0.0`) | Auto or `--major` or `impactLevel`        |
| Failed test                        | No bump          | Return handled via `CdFxStateLevel.Error` |

🛠 Integration Point

    Version bumping can be done:

        After a successful test run

        If and only if the associated roadmap item has assert

        Integrated in the ci:release or cd-cli test --apply

## Summary

This self-test approach offers:

* Declarative test integration
* Auto-validation of roadmap goals
* Tight linkage with changelogs and documentation
* Enforced structure using `cdRequest` and `CdFxReturn`
* Developer simplicity with standard input/output patterns

It sets a path for future enhancements such as:

* Runtime test dashboards
* Per-method test suites
* Snapshot-based changelog diffs
* Auto-publish of validated module versions
