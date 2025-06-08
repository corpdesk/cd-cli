# Corpdesk Module Template Developer Guide

## Overview
cd-cli is a terminal application built with Node.js as part of the Corpdesk development ecosystem. It helps developers automate various development processes, particularly around module creation and management.

## cd-cli Features
- Create new repositories
- Clone existing repositories
- Generate new modules from templates
- Maintain template synchronization via Git
- Version control for templates

## Installation
```bash
npm install -g cd-cli
```

## cd-cli Template directory

The CLI maintains templates in the following structure:

```
src/templates/
├── cd-api
│   └── abcd
│       ├── controllers/
│       ├── models/
│       ├── services/
│       └── README.md
└── module-frontend/
```

## Template System
abcd Template

The abcd template under cd-api serves as the base template for new modules. It includes:

    Standard MVC structure (controllers, models, services)

    TypeScript implementation

    Ready-to-use example code

## Template Synchronization

### The CLI maintains template updates through:

    Git integration for version control

    Periodic synchronization with the template repository

    Version checking before operations

## Usage
### Creating a New Module

```
cd-cli create-module <module-name> [options]
```

### Options:

    --api: Create an API module (default)

    --frontend: Create a frontend module

    --template: Specify alternative template (default: abcd)

## Example:

```
cd-cli create-module cd-ai --api
```

### This will:

    Create a new module structure based on the abcd template

    Replace all placeholder values with your module name

    Generate standard controllers, models, and services

## Managing Controllers

When creating a new module, you can specify controllers:
bash
```
cd-cli create-module cd-ai --controllers main,usage-logs
```

### This will generate:

    cd-ai.controller.ts (main controller)

    cd-ai-usage-logs.controller.ts

## Template Synchronization

To update your local templates:
bash
```
cd-cli sync-templates
```
### This command:

    Checks for template updates

    Pulls latest changes from the template repository

    Preserves any local customizations

    Updates version metadata

## Versioning

The CLI maintains version information in:

    .cd-template-version (per project)

    Global template version in CLI config

Check versions with:
```
cd-cli --version
cd-cli template-version
```
# Development

## Adding New Templates

    Create a new directory under cd-api/ or module-frontend/

    Follow the same structure as the abcd template

    Add a README.md explaining the template's purpose

    Commit and push to the template repository

## Template Variables

### When creating new modules, these placeholders are replaced:

    abcd → your module name

    Abcd → PascalCase module name

    ABCD → UPPERCASE module name

## Best Practices

    Always sync templates before creating new modules

    Use descriptive controller names

    Maintain version compatibility between CLI and templates

    Document any template customizations

## Troubleshooting
Common Issues

Template sync fails:

    Check network connection

    Verify Git permissions

    Run cd-cli repair-templates

Placeholders not replaced:

    Ensure module name doesn't contain special characters

    Check template files for correct placeholder format

## Roadmap

    Frontend template implementation

    Template customization system

    Enhanced version conflict resolution

    Template validation system


This guide provides comprehensive documentation for developers using and contributing to your cd-cli tool. The markdown file is ready for download and can be further customized as needed.