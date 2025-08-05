# Corpdesk Orchestration Manifesto (cd-orch)

## Vision Statement

To create an open, extensible, and intelligent orchestration platform that enhances software development through discipline, automation, and collaborative cognition between humans and machines — without disrupting traditional development workflows.

## Core Philosophy

* **Preserve the Craft**: Empower developers to continue using familiar tools — TypeScript, Git, JSON, CLI — while enabling automation and insight.
* **Enhance the Flow**: Introduce machine-readable structures and strict naming conventions to enable intelligent orchestration and automation.
* **Separate Machine Intent from Human Intent**: Let the software be understandable, maintainable, and modifiable by both human engineers and AI agents.
* **Convention over Configuration**: Standardize how software features, workflows, and modules are defined and organized to allow predictable behavior.

## Primary Components

### 1. cd-orch

The core orchestration engine that:

* Understands and manages project workflows
* Processes descriptors to execute creation, upgrade, maintenance, deployment, etc.
* Serves as the central coordination brain across CLI and daemon interfaces

### 2. cd-cli

The developer interface:

* Allows local and remote operations
* Interacts with `.descriptor.json`, `roadmap.json`, `changelog.json`, etc.
* Executes tasks as a command-line user would, but using orchestration pipelines

### 3. cd-daemon

The machine interface:

* Runs in the background as a Linux socket or system service
* Listens for RPC or socket-based invocations
* Executes tasks for self-healing, updates, or background maintenance

### 4. cd-registry (optional)

* A remote or distributed service for:

  * Module discovery
  * Descriptor validation
  * Version coordination
  * Peer sync and learning across deployments

## Guiding Principles

* **Modularity**: Each module (app/sys) is isolated, self-describing, and pluggable.
* **Descriptor-Driven**: Descriptors (`cd-app.descriptor.json`, `cd-module.descriptor.json`) are the single source of truth.
* **Testable Units**: Every task or feature can be mapped to tests, roadmap, changelog, and documentation.
* **Minimal Lock-In**: Adopts existing standards (GitHub, TypeScript, JSON, Node) and extends them without altering native flow.

## Practical Outcomes

* Intelligent agents can self-deploy, test, document, and report progress.
* Developers can scaffold and automate lifecycle tasks from terminal or through API.
* Organizations can innovate around the platform by plugging in their own policies or agents.
* Software is no longer opaque; it is expressive, auditable, testable, and collaborative.

## Long-Term Goals

* **Self-Aware Applications**: Software that knows its own health, state, and roadmap.
* **Peer-Aware Ecosystems**: Modules that sync knowledge across instances.
* **Global AI Collaboration**: AI developers using the same structure to build agents that understand and interact with corpdesk-powered apps.

## Call to Action

To developers, architects, AI agents, and organizations:

> Join us in shaping a world where software is not just written, but cultivated — grown with care, orchestrated with clarity, and maintained with intelligence.

> **This is cd-orch. This is the future of collaborative software development.**
