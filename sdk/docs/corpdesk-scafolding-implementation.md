## 1. High-Level Architecture
```lua
+--------------------+
| GenControllerService|  <-- Generates controllers
+--------------------+
           ▲
           |
+--------------------+
| GenServiceService  |  <-- Generates services
+--------------------+
           ▲
           |
+--------------------+
| GenComponentService|  <-- Shared logic
+--------------------+
           ▲
           |
+--------------------+
| Core Utils         |  <-- RFC naming rules, path utils, validators
+--------------------+

```

## 2. Class Roles
### GenComponentService (shared core)

    Responsibilities:

        Dependency Resolution

            Takes raw import statements or DependencyDescriptor[]

            Resolves paths & categories based on RFC rules

            Groups imports in RFC order: npm → sys-core → sys-utils → sys-modules → app-modules → this-module

        Naming Transformations (RFC-0001)

            toPascalCase, toCamelCase, toKebabCase, toSnakeCase

            Apply placeholder substitutions (Abcd, abcd, etc.)

        Code Assembly

            Build sections in order:

                Header imports (from resolved dependencies)

                Class definition (from descriptor type)

                Attributes

                Constructor

                Methods

            Merge with template snippets only as reference, never full text replacement.

        Validation

            Structural validation (imports grouped, order correct, class present)

            Naming validation (Pascal, camel, kebab, snake)

            Auto-correction loop

### GenControllerService

    Extends/uses GenComponentService

    Passes controller-specific CdControllerDescriptor to GenComponentService

    Adds:

        Route decorators (based on RFC rules)

        Controller-specific constructor injections

        Optional methods for REST endpoints (getAll, getOne, create, update, delete)

### GenServiceService

    Extends/uses GenComponentService

    Passes service-specific CdServiceDescriptor

    Adds:

        Repository/model imports

        Business logic method stubs

        Service-specific DI rules

## 3. Workflow Sequence

```mermaid
sequenceDiagram
    participant User
    participant ControllerGen as GenControllerService
    participant ServiceGen as GenServiceService
    participant CompGen as GenComponentService
    participant DepProc as Dependency Processor
    participant FS as FileSystem

    User->>ControllerGen: generateController(moduleDescriptor)
    ControllerGen->>CompGen: prepareGeneration(descriptor, type="controller")
    CompGen->>DepProc: classifyDependencies(importList)
    DepProc-->>CompGen: DependencyDescriptor[]
    CompGen->>CompGen: transformNames(RFC rules)
    CompGen->>CompGen: buildCodeSections()
    CompGen->>CompGen: validateAndCorrect()
    CompGen->>FS: writeToOutput()
    FS-->>User: ✅ Controller Generated

    User->>ServiceGen: generateService(moduleDescriptor)
    ServiceGen->>CompGen: prepareGeneration(descriptor, type="service")
    
```

## 4. Key Implementation Pieces

    Dependency Processor

        A shared method in GenComponentService

        Converts import strings → DependencyDescriptor[] → grouped imports

        Knows about:

            npm packages

            sys modules

            app modules

            base + utils special cases

    ProcessValidator

        Applies RFC naming transformations consistently during processing

        Guarantees no “Type” type duplication

    Template Snippet Manager

        Holds small, re-usable code fragments (constructor example, method stub)

        Not full files

        Can be swapped per RFC version

    PreWriteValidator

        Runs before file write

        Corrects order, naming, missing sections

        Provides debug report

## Component Interaction Diagram

```mermaid
classDiagram
    class GenComponentService {
        +generateComponent(descriptor, type, action)
        +processDependencies(imports): DependencyDescriptor[]
        +groupImports(dependencies): string
        +transformNames(name, context): string
        +buildClass(definition): string
        +validateAndCorrect(code): string
        +writeFile(outputPath, content)
    }

    class GenControllerService {
        +generateAllControllers(moduleDescriptor, action)
        -buildControllerDescriptor(controller)
    }

    class GenServiceService {
        +generateAllServices(moduleDescriptor, action)
        -buildServiceDescriptor(service)
    }

    class DependencyProcessor {
        +classifyImport(importPath, symbols): DependencyDescriptor
        +deriveResolution(importPath, moduleCtx, targetCtx): ResolutionDescriptor
    }

    class NamingFilter {
        +toPascalCase(input): string
        +toCamelCase(input): string
        +toKebabCase(input): string
        +toSnakeCase(input): string
        +applyPlaceholders(template, nameMap): string
        +validateName(name, context): boolean
    }

    class TemplateSnippetManager {
        +getConstructorSnippet(type): string
        +getMethodStubSnippet(type, methodName): string
    }

    class PreWriteValidator {
        +validateStructure(code): ValidationResult
        +validateNaming(code): ValidationResult
        +autoCorrect(code, errors): string
    }

    GenControllerService --> GenComponentService : uses
    GenServiceService --> GenComponentService : uses
    GenComponentService --> DependencyProcessor : uses
    GenComponentService --> NamingFilter : uses
    GenComponentService --> TemplateSnippetManager : uses
    GenComponentService --> PreWriteValidator : uses

```

## Flow Explanation

    Specialized Service Calls Shared Core

        GenControllerService calls GenComponentService.generateComponent()

        Passes the controller’s descriptor + type "controller"

    Shared Core Delegates

        Uses DependencyProcessor to turn import strings → DependencyDescriptor[]

        Groups them in RFC order

    ProcessValidator Ensures Conventions

        Converts placeholders (Abcd, abcd, etc.) into RFC-compliant names based on context (class, file, variable)

    Template Snippet Manager Injects Reference Fragments

        Adds constructors, DI injections, or method stubs as per type

    PreWriteValidator Checks RFC Compliance

        Runs structure + naming checks before writing

        Auto-corrects where possible

    Output

        GenComponentService writes the file to the correct repo directory based on CdModuleDescriptor.versionControl.repository.directories