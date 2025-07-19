# CdWire Protocol Specification

## Overview

**CdWire** is a modern application-level protocol designed to enable structured, scalable, and efficient communication across components in distributed or modular systems. It is inspired by proven standards like REST, GraphQL, and gRPC, but is built around a descriptor-driven architecture that brings flexibility, transport neutrality, and deeper workflow integration.

While REST emphasizes resources, GraphQL emphasizes declarative queries, and gRPC emphasizes binary efficiency, **CdWire emphasizes descriptor-driven task execution** — where tasks are declaratively defined and dynamically resolved via a minimal yet powerful request/response structure.

## Why CdWire?

Modern systems often need to:

* Route calls between frontend, backend, CLI, and even internal workflows
* Maintain flexibility of transports (e.g., HTTP, CLI, in-memory)
* Avoid boilerplate-heavy service definitions
* Support domain-driven design via structured descriptors

**CdWire** fulfills this need by supporting **dynamic descriptor execution**, **transport-independence**, and **semantic response mapping** using structured, strongly typed contracts.

---

## Key Components

### ICdRequest

A unified request interface to trigger execution in any transport mode (HTTP, CLI, local RPC, etc.).

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

* `ctx`: context, often representing module scope
* `m`, `c`, `a`: method, controller, and action respectively
* `dat`: encapsulated HTTP-specific data
* `args`: payload for in-process or local invocation

> CdWire allows this structure to work seamlessly for HTTP requests and local method executions.

### ICdResponse

Typically returned in HTTP-mode exchanges, representing structured application response.

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

export interface IServerConfig {
  usePush: boolean;
  usePolling: boolean;
  useCacheStore: boolean;
}

export interface IRespInfo {
  messages: string[];
  code: string | null;
  app_msg: string | null;
}

export interface ISessResp {
  cd_token?: string;
  userId?: number | string | null;
  jwt: {
    jwtToken: string | null;
    checked: boolean;
    checkTime: number | null;
    authorized: boolean;
    ttl: number | null;
  } | null;
  ttl: number;
  initUuid?: string;
  initTime?: string;
}
```

* `app_state`: provides holistic session state including authentication, messaging, caching, and more
* Used primarily for browser or network-interfaced apps

### CdFxReturn

CdWire's preferred method response format, used in internal and RPC-style executions.

```ts
export interface CdFxReturn<T> {
  data?: T | null;
  state: boolean | CdFxStateLevel; // Interpreted through semantic map
  message?: string | null;
}
```

Supports both traditional boolean flags and rich semantic outcomes:

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

CdFxReturn’s versatility lies in enabling more nuanced interpretations of outcomes, essential in complex automation or feedback-driven systems.

---

## Protocol Features

### 📦 Descriptor-Centric Execution

Execution is centered around descriptors — structured definitions of modules, controllers, services, and methods. This enables auto-discovery, introspection, and schema-based design.

### 🔗 Transport-Agnostic

Works equally well over:

* HTTP (via JSON payloads)
* CLI (command execution with inquirer prompts)
* In-memory workflows (between services/modules)

### ⚙️ Consistent Return Shape

All methods respond using the `CdFxReturn<T>` shape, supporting:

* Predictable pipelines
* Unified error/success handling
* Systematic rollback or retries

### 🚀 Inter-Component Versatility

CdWire powers communication:

* Between frontend and backend (via HTTP)
* Between CLI and internal services
* Inside composite workflows
* For scheduled or triggered automation

---

## Adoption Example

Here’s a sample usage in a CLI or backend context:

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
  console.warn('Failed to create user:', response.message);
}
```

---

## Summary

**CdWire** represents the Corpdesk protocol for high-efficiency, flexible, and semantically rich communication across all layers of a distributed application — CLI, backend, frontend, and beyond.

By unifying the concepts of request structure, semantic return mapping, and descriptor-based execution, **CdWire** allows systems to be self-aware, evolvable, and maintainable.

Corporations and developers seeking to move beyond rigid API structures toward agile, introspective systems will find CdWire a solid foundation.

---

## Appendix: Comparison Table

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

## Future Outlook

Plans include:

* Drafting formal RFC-style documentation
* Providing SDKs for other languages (Python, Go, Rust)
* Publishing descriptor and protocol format specifications
* Encouraging ecosystem tooling support (e.g., inspectors, debuggers, adapters)

---

Let us know if you'd like to adopt **CdWire** in your system. We welcome community feedback and contributions.
