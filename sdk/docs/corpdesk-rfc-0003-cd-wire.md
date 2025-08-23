# Corpdesk Wire Protocol (RFC-0003)

## 1. Introduction

**CdWire** is the official communication protocol of the Corpdesk ecosystem. It defines how applications, modules, and services communicate with each other in a consistent, structured, and transport-agnostic manner. Unlike REST, GraphQL, or gRPC, CdWire is descriptor-driven, meaning that execution is guided by the metadata and descriptors defined in the Corpdesk architecture. This allows for seamless automation, introspection, and interoperability across frontend, backend, CLI, and in-memory workflows.

This RFC supersedes ad-hoc references to CdWire in **RFC-0001** and defines it formally as a standalone protocol.

---

## 2. Objectives

CdWire was designed to:

* Enable **descriptor-centric execution** across all Corpdesk environments.
* Provide a **transport-agnostic** mechanism (HTTP, CLI, in-memory).
* Support **consistent return contracts** via `CdFxReturn<T>`.
* Allow **semantic state mapping** using `CdFxStateLevel`.
* Reduce boilerplate through declarative task invocation.

---

## 3. Protocol Components

### 3.1 Request (ICdRequest)

All invocations use a common request envelope:

```ts
export interface ICdRequest {
  ctx: string;
  m: string;
  c: string;
  a: string;
  dat: EnvelopDat;
  args: any | null;
}

export interface EnvelopDat {
  f_vals: EnvelopFValItem[];
  token: string | null;
}

export interface EnvelopFValItem {
  query?: IQuery | null;
  data?: any;
  extData?: any;
  jsonUpdate?: any;
}
```

* **ctx**: context (usually module scope)
* **m**: method
* **c**: controller
* **a**: action
* **dat**: encapsulated data (form values, token, etc.)
* **args**: direct argument payload

### 3.2 Response (ICdResponse)

Typical HTTP-mode responses return:

```ts
export interface ICdResponse {
  app_state: IAppState;
  data: any;
}

export interface IAppState {
  success: boolean;
  info: IRespInfo | null;
  sess: ISessResp | null;
  cache: object | null;
  sConfig?: IServerConfig;
}
```

This structure provides session, configuration, and messaging information, enabling browser apps and remote clients to maintain state.

### 3.3 Internal Returns (CdFxReturn)

Within Corpdesk services and workflows, methods must return `CdFxReturn<T>`:

```ts
export interface CdFxReturn<T> {
  data?: T | null;
  state: boolean | CdFxStateLevel;
  message?: string | null;
}
```

#### CdFxStateLevel

```ts
export enum CdFxStateLevel {
  Error = 0,
  Success = 1,
  PartialSuccess = 2,
  LogicalFailure = 3,
  Warning = 4,
  Recoverable = 5,
  Info = 6,
  Pending = 7,
  Cancelled = 8,
  NotFound = 9,
  NotImplemented = 10,
  SystemError = 11,
  Fatal = 12,
  Unknown = 13,
}
```

This enables **semantic-rich error and state handling** across the stack.

---

## 4. Features

* **Descriptor-Centric**: Executes methods based on descriptors (modules, controllers, services).
* **Transport-Neutral**: Works over HTTP, CLI, or in-memory.
* **Unified Contract**: Enforces `CdFxReturn<T>`.
* **Automation-Ready**: Aligns with CdCLI (RFC-0002) and module descriptors (RFC-0001).

---

## 5. Example: CLI Invocation

```ts
const request: ICdRequest = {
  ctx: 'user',
  m: 'user-management',
  c: 'user',
  a: 'createUser',
  dat: { f_vals: [], token: null },
  args: { name: 'George', role: 'admin' },
};

const response: CdFxReturn<User> = await executeCdRequest(request);

if (response.state === CdFxStateLevel.Success) {
  console.log('User created:', response.data);
} else {
  console.warn('Failed:', response.message);
}
```

---

## 6. Comparison

| Feature            | REST        | GraphQL     | gRPC       | **CdWire**      |
| ------------------ | ----------- | ----------- | ---------- | --------------- |
| Query Format       | URL + Body  | GraphQL DSL | Protobuf   | JSON Descriptor |
| Transport          | HTTP        | HTTP        | HTTP/2     | Any             |
| Schema             | OpenAPI     | SDL         | Protobuf   | Descriptor JSON |
| Return Format      | Raw JSON    | Raw JSON    | Protobuf   | `CdFxReturn<T>` |
| Response Semantics | HTTP Status | N/A         | gRPC Codes | CdFxStateLevel  |
| Use in CLI         | ❌           | ❌           | ❌          | ✅               |
| Use in Workflows   | ⚠️ Partial  | ⚠️ Limited  | ❌          | ✅               |

---

## 7. Future Scope

* SDKs for Python, Go, Rust.
* Descriptor registry and validation tools.
* Integration with runtime module loader (RFC-0004).
* Inspector and debugging adapters.

---

## 8. Conclusion

CdWire is the backbone protocol of Corpdesk, designed to unify communication across all environments. By enforcing descriptor-driven execution and semantic return contracts, it provides a robust foundation for scalable, automated, and AI-assisted development.

---

### Document Version: RFC-0003

Status: Draft
Published: August 17, 2025
Updated: August 17, 2025
Author: George Oremo
Use Case: Documentation, Standardization, Protocol Definition


---

Let us know if you'd like to adopt **CdWire** in your system. We welcome community feedback and contributions.
