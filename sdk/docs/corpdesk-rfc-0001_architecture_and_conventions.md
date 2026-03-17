# Corpdesk Standard Development Architecture (RFC-0001)

## 1. Introduction

Corpdesk is a framework for building modular, distributed, and extensible applications across both backend and frontend environments. It is intentionally designed to support development automation through both CLI and AI-assisted methods. At the same time, Corpdesk follows conventional software development practices, allowing traditional developers to engage without needing to learn new tools or concepts—development can proceed entirely without the CLI or AI if preferred. This document defines the structural, naming, and organizational standards used in Corpdesk development. It provides guidance for both human developers and machine agents, forming a foundation for automated development, versioning, and runtime modularity.

This standard is language-agnostic, though illustrations in this document use Node.js with TypeScript for clarity.

---

## 2. File Structure and Hierarchy

### 2.1 General Directory Hierarchy

```
<root-directory>/src/<AppName-PascalCase>/
                           ├── sys(kebab-case)/
                           │   └── <list-of-core-modules-kebab-case>/
                           └── app(kebab-case)/
                               └── <list-of-feature-modules-kebab-case>/
```

### 2.2 Integration Consideration

Corpdesk modules may coexist or integrate with other applications or frameworks as long as the structural and naming conventions defined here are strictly preserved.

---

## 3. Application Structure

### 3.1 Application Types

Common Corpdesk applications include:

* **cd-api**: Backend RPC-style service layer over HTTP using a structured command envelope (CdWire). Note: Corpdesk does not follow the RESTful protocol. Instead, it uses a streamlined RPC-style interface called CdWire — a structured, JSON-based command envelope.
* **cd-cli**: Developer Command Line Interface.
* **cd-shell**: Progressive Web Application based front end for corpdesk system.

Inside a given src directory, the system resides in a PascalCase-named root directory (CdApi, CdCli, CdPwa, etc).

---

## 4. Modules

### 4.1 Module Types

* **Sys Modules**: Core internal modules that power the Corpdesk system.
  Examples: `user`, `moduleman`, `scheduler`, `cd-cli`, `cd-dev`, etc.

* **App Modules**: Feature or business-specific modules, including third-party extensions.
  Examples: `cd-hrm`, `cd-accts`, `coops`, `cd-ai`, etc.

### 4.2 Module Structure

---

## 4.2 Module Structure

Each module consists of one or more standard directories. At minimum:

```text
<module-name-kebab-case>/
  ├── controllers(kebab-case)/
  ├── models(kebab-case)/
  └── services(kebab-case)/
```

### Directory Purposes

* **controllers/**
  Contains request/response logic or runtime orchestration.
  Controllers expose public methods that can be invoked externally (via CdWire on the backend, or via UI events in a frontend `view/`).
  All files must end with `.controller.<ext>` and hosted classes must end with `Controller`.

* **services/**
  Contain core business logic, reusable across controllers.
  Services are typically stateless and focused on operations, calculations, and process flows.
  All files must end with `.service.<ext>` and hosted classes must end with `Service`.

* **models/**
  Contain data models, schema mappings, and entity definitions.
  Models represent tables (backend), or typed interfaces and DTOs (frontend/backend).
  All files must end with `.model.<ext>` and hosted classes must end with `Model`.

* **view/** *(optional, GUI clients only)*
  Dedicated to frontend user interface logic.
  Contains the runtime entry point (`index.js`), templates, and GUI-specific controllers.
  While backend controllers handle service orchestration, **view controllers** handle UI events, rendering, and module-level presentation logic.<br>
  Example:

  ```text
  view/
    ├── index.js        # entry point rendered by loader
    ├── module.json     # module metadata descriptor
    ├── sign-in.controller.js
    └── sign-up.controller.js
  ```

### Additional Directories

* **extra/** — supplementary files not fitting standard categories.
* **interfaces/** — shared TypeScript interfaces.
* **dist/** — build outputs.
* **sdk/** — client libraries or API wrappers.

---

This way, `view/` is clearly positioned as **UI-only, optional, and separate from backend controllers/services**, but still integrated under the same modular discipline.

Would you like me to also **add a dedicated subsection (maybe 4.3)** that explains the **relationship between backend controllers/services and frontend `view/` controllers** — showing how `loadModule()` stitches them together at runtime?

---

Date: 2025-10-3, Time: 01:08


---

## 5. Naming Conventions

### 5.1 File and Directory Naming

| Element               | Naming Convention                                                          | Example                                            |
| --------------------- | -------------------------------------------------------------------------- | -------------------------------------------------- |
| Application Directory | PascalCase                                                                 | `CdApi`, `CdCli`                                   |
| Module Directory      | kebab-case                                                                 | `cd-scheduler`, `coops`                            |
| Controller Files      | `<name>.controller.ts` (sys)<br>`<module-name>-<name>.controller.ts` (app) | `user.controller.ts`, `coops-member.controller.ts` |
| Service Files         | `<name>.service.ts` (sys)<br>`<module-name>-<name>.service.ts` (app)       | `user.service.ts`, `coops-member.service.ts`       |
| Model Files           | `<name>.model.ts` (sys)<br>`<module-name>-<name>.model.ts` (app)           | `user.model.ts`, `coops-member.model.ts`           |
| DB Table Names        | snake\_case                                                                | `user_account`, `coops_member`                     |

All files in the controllers directory must end with `.controller.<extension>` and the name of the hosted class must end with `Controller`.
All files in the models directory must end with `.model.<extension>` and the name of the hosted class must end with `Model`.
All files in the services directory must end with `.service.<extension>` and the name of the hosted class must end with `Service`.

### 5.2 Class and Variable Naming

| Element                   | Convention       | Example                               |
| ------------------------- | ---------------- | ------------------------------------- |
| Class Names               | PascalCase       | `CoopMemberController`, `UserService` |
| Class Attributes          | camelCase        | `createdAt`, `userEmail`              |
| Public Controller Methods | PascalCase       | `GetUserById()`                       |
| Internal Methods          | camelCase        | `resolveDependencies()`               |
| Controller Instances      | `ctl<ClassName>` | `ctlCoopMember`                       |
| Service Instances         | `sv<ClassName>`  | `svCoopMember`                        |

---

## Section 6: Models, Entities, Tables, and Columns
### 6.1 Overview

Corpdesk tables and entity properties follow strict naming rules to:

Enforce predictability across modules.

Support runtime modularity.

Prevent ambiguity between resident, visitor, and special fields.

A core principle is that every module has a leading table. This influences whether the <controller-name> is included in the schema.

### 6.2 Table Naming
#### 6.2.1 Module-Leading Tables

Each module has one leading table, named exactly after the module.

Fields are prefixed with the module name.

Example:

coop → leading table for Coop module.

company → leading table for Company module.

doc → leading table for Doc module.

➡️ Fields:

coop_id, coop_name, coop_guid, etc.

company_id, company_name, etc.

doc_id (reserved, universal reference).

### 6.2.2 Controller Tables

Non-leading tables follow this convention:

Example:

cd_accts_coa (controller = Chart of Accounts).

cd_accts_coa_type (counterpart = Type of Chart of Accounts).

cd_geo_location (controller = Location under Geo module).

➡️ Columns then follow the same structure, prefixed by table name:

cd_accts_coa_id

cd_accts_coa_type_id

cd_geo_location_id

### 6.3 Column Naming

Columns fall into three categories:

#### 6.3.1 Resident Fields

Fields that belong to the current table.

Always prefixed with the table name.

Examples:

coop_description (from leading coop table).

cd_accts_coa_type_name (from controller table).

#### 6.3.2 Visitor Fields

Foreign keys referencing another table.

Always prefixed with the referenced table’s name (not the current one).

### Examples:

company_id in coop (references company module-leading table).

cd_geo_location_id in coop (references cd_geo_location table).

#### 6.3.3 Special / Reserved Fields

Managed centrally by the doc module.

Always written exactly as doc_id.

No variations (❌ coop_doc_id).

No timestamps (created_at, updated_at are forbidden).

### 6.4 Entity Properties (TypeORM Layer)

Columns map to camelCase entity properties.

coop_description → coopDescription.

cd_accts_coa_type_guid → cdAcctsCoaTypeGuid.

No duplication of suffixes/prefixes.

Normalize to avoid TypeType.

Resident/Visitor/Special rules preserved in property names.

### 6.5 Practical Examples
Coop (leading table)

```sql
CREATE TABLE `coop` (
  `coop_id` int NOT NULL AUTO_INCREMENT,
  `coop_name` varchar(50) DEFAULT NULL,
  `coop_description` varchar(100) DEFAULT NULL,
  `coop_guid` varchar(40) DEFAULT NULL,
  `coop_type_id` int DEFAULT NULL,
  `coop_enabled` tinyint DEFAULT NULL,
  `doc_id` int DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `cd_geo_location_id` int DEFAULT NULL,
  PRIMARY KEY (`coop_id`)
);
```
Entity file
```ts
@Entity({ name: "coop" })
export class CoopModel {
  @PrimaryGeneratedColumn({ name: "coop_id" })
  coopId!: number;

  @Column({ name: "coop_name" })
  coopName!: string;

  @Column({ name: "coop_description" })
  coopDescription!: string;

  @Column({ name: "coop_guid" })
  coopGuid!: string;

  @Column({ name: "coop_type_id" })
  coopTypeId!: number;

  @Column({ name: "coop_enabled" })
  coopEnabled!: boolean;

  @Column({ name: "doc_id" })
  docId!: number;

  @Column({ name: "company_id" })
  companyId!: number;

  @Column({ name: "cd_geo_location_id" })
  cdGeoLocationId!: number;
}
```

⚖️ Summary Rule:

Leading table → <module>_<field>.

Controller table → <module>_<controller>_<field>.

Counterpart table → <module>_<controller>_<counterpart>_<field>.

Visitor field → Prefix of referenced table.

Special field → Always doc_id.



---

## 7. Instantiation and Lifecycle Rules

To enable standardization and support automation:

* No dependency injection frameworks.
* All class instances must be created without constructor arguments.
* Use a standardized `init()` method for class setup.
* All externally consumable methods must return `CdFxReturn<T>` as defined in **RFC-0003 (CdWire Protocol)**. This ensures uniform handling of success, errors, and semantic states across all modules.

Example:
```pgsql
<module-name>_<controller-name>_<counterpart-name?>
```

```ts
const ctlCoopMember = new CoopMemberController();
await ctlCoopMember.init(optionalInput?);
```

---

## 8. Base Module and Shared Code

* `base/` directory under `sys/` contains shared abstractions and base classes.
* Not considered a full module.
* Does not contain a controller.

### Examples:

* `i-base.ts`: Shared interfaces
* `BaseService.ts`: Abstract class extended by most services

---

## 9. Descriptors Concept

### 9.1 Purpose

Descriptors define the structure, metadata, and identity of every Corpdesk entity—modules, controllers, models, services, and CI/CD processes.

Descriptors enable:

* Standardization
* Automation
* Toolchain integration
* Runtime introspection
* Progressive documentation

### 9.2 Types of Descriptors

| Descriptor               | Purpose                      |
| ------------------------ | ---------------------------- |
| `BaseDescriptor`         | Common base descriptor       |
| `CdModuleDescriptor`     | Represents a Corpdesk module |
| `CdControllerDescriptor` | Represents a controller      |
| `CdServiceDescriptor`    | Represents a service         |
| `CdModelDescriptor`      | Represents a model           |
| `CiCdDescriptor`         | Represents CI/CD flows       |

Each descriptor has a `.name` property in kebab-case to maintain consistency.

```json
{
  "name": "cd-scheduler",
  "controllers": [{ "name": "task-runner" }],
  "models": [{ "name": "task-log" }]
}
```

---

## 10. Design Philosophy

* Modular and extensible by design.
* Convention over configuration.
* Facilitates runtime installation and introspection.
* Language and platform agnostic.
* Emphasizes machine-readability to support intelligent automation and AI tooling.
* To support automation and AI-driven tooling, Corpdesk enforces consistent method return shapes. This is standardized under **RFC-0003: CdWire Protocol**.

---

## 11. Use Cases

* Enterprise backend systems
* AI-enabled process automation
* Modular feature deployments
* Distributed services orchestration
* Progressive web application backends

---

## 12. Future Scope

* Protocol versioning
* AI-assisted module scaffolding
* Intelligent descriptors registry
* Plug-and-play modules from a marketplace
* Federated module communication and sandboxing

---

## 13. Conclusion

The Corpdesk Standard provides a unified approach to modular software architecture. By combining strict naming conventions, a descriptor-driven model, and platform-agnostic design principles, Corpdesk enables teams and tools to collaborate and automate more effectively across the software development lifecycle.

While RFC-0001 defines structural and naming standards, operational consistency for method responses (via `CdFxReturn<T>`) is defined in **RFC-0003: CdWire Protocol**. Together, these RFCs ensure cohesion between development structure and runtime communication.

---

## 14. References

* Corpdesk Descriptor Specification (forthcoming)
* RFC-0002: CdCLI Protocol Specification
* RFC-0003: CdWire Protocol
* Git Repository: \[TBD]

---

### Document Version: RFC-0001

---
Last Edit: 16th March, 2026 
Edited: September 3, 2025
Summary of Updates:

Added view/ directory under Module Structure (Section 4.2).

Clarified that view/ applies only to GUI-enabled clients.

Updated Naming Conventions and Descriptors Concept to acknowledge view/.

Adjusted Conclusion to emphasize frontend modularity alignment.

Status: Draft
Last Edited: September 26, 2025
Author: George Oremo
Use Case: Documentation, Standardization, Patent Support

Last Edited: September 24, 2025
Added section 6 with special emphasis on model/entity naming conventions.
All other susequent numbers affected.

---

Status: Draft
Last Edited: August 17, 2025
Author: George Oremo
Use Case: Documentation, Standardization, Patent Support

---

Date Published: 2025-08-06
Date Updated: 2025-08-17
**Summary of Updates:** Linked `CdFxReturn<T>` to RFC-0003 for method response standardization. Clarified lifecycle rules (Section 6), added explicit references in Design Philosophy (Section 9) and Conclusion (Section 12).
