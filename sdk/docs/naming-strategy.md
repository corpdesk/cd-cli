# Corpdesk Naming Strategy & Entity Generation

This document outlines the standardized approach to naming conventions and entity generation within the Corpdesk framework, especially for `cd-api` modules.

---

## 🔧 Naming Strategy

| Element            | Format Example           | Notes |
|--------------------|--------------------------|-------|
| Module Name        | `coop`                   | Lowercase; singular or plural contextually |
| Controller Name    | `CoopMemberController`   | PascalCase |
| Model Class Name   | `CoopMemberModel`        | Derived from controller |
| Service Class Name | `CoopMemberService`      | Derived from controller |
| Variable Prefix    | `coopMember`             | camelCase version of controller name |
| File Names         | `coop-member.model.ts`   | kebab-case |
| Table Name         | `coop_member`            | snake_case |

---

## 🏗️ Conventions & Case Utilities

These utilities help derive consistent naming for code automation.

```ts
const modulePascal = toPascalCase(moduleData.name);       // e.g., 'coop' → 'Coop'
const controllerPascal = toPascalCase(controllerName);    // e.g., 'coop-member' → 'CoopMember'
const controllerCamel = toCamelCase(controllerName);      // e.g., 'coop-member' → 'coopMember'
const controllerKebab = toKebabCase(controllerName);      // e.g., 'CoopMember' → 'coop-member'
const controllerSnake = toUniversalSnakeCase(controllerName); // e.g., 'CoopMember' → 'coop_member'
```

## 🧱 Entity File Generation (Model)
Objective

To generate a complete TypeORM-compatible .model.ts file from a CdModuleDescriptor using consistent naming, casing, and mapping rules.
Example

Given:

    moduleName = "coop"

    controllerName = "coop-member"

Then:

    File: src/CdApi/app/coop/models/coop-member.model.ts

    Class: CoopMemberModel

    Table: coop_member

    Columns: Based on FieldDescriptor[] in CdModelDescriptor

## 📍Naming Mapping Summary

| Input String    | Output Case Function     | Output Example |
| --------------- | ------------------------ | -------------- |
| `"coop-member"` | `toCamelCase()`          | `coopMember`   |
| `"coop-member"` | `toPascalCase()`         | `CoopMember`   |
| `"CoopMember"`  | `toKebabCase()`          | `coop-member`  |
| `"CoopMember"`  | `toSnakeCase()`          | `coop_member`  |
| `"CoopMember"`  | `toUniversalSnakeCase()` | `coop_member`  |


## 🧪 Future Enhancements

    Extension of this system to include automatic controller and service file generation.

    Inclusion of relationship handling (e.g., @OneToMany) based on relationships property in CdModelDescriptor.


## 📄 This document will be output as `doc/naming-and-entity-generation.md`.

---

✅ Next step: I will now proceed to implement `generateEntityFile()` using the case variables (`modulePascal`, `controllerPascal`, etc.) and the latest `CdModelDescriptor` structure. ​:contentReference[oaicite:0]{index=0}​

✅ The reference documentation has been generated successfully:

📄 Download: naming-and-entity-generation.md

Next, I’ll proceed with implementing the generateEntityFile() method using the updated CdModelDescriptor structure and naming strategy.