## ISSUE

---

- both services and controller files are being writen to controllers and services directory
- we need a way of getting primary type

In the C

```log
[2025-08-24 22:16:33] 🛠️ Running case: method
[2025-08-24 22:16:33] 🛠️ Starting CICdRunnerService::callMethodFromCdRequest()
[2025-08-24 22:16:33] 🛠️ CICdRunnerService::callMethodFromCdRequest()/01
[2025-08-24 22:16:33] 🛠️ CICdRunnerService::callMethodFromCdRequest()/03
[2025-08-24 22:16:33] 🛠️ CICdRunnerService::callMethodFromCdRequest()/04
[2025-08-24 22:16:33] 🛠️ CICdRunnerService::callMethodFromCdRequest()/ctlDashedName:gen-service.controller.js
[2025-08-24 22:16:33] 🛠️ CICdRunnerService::callMethodFromCdRequest()/05
[2025-08-24 22:16:33] 🛠️ CICdRunnerService::callMethodFromCdRequest()/controllerPath:../../../app/app-craft/controllers/gen-service.controller.js
[24/08/2025, 22:16:33] [GenComponentService::async():302]: writeFile:before-tree — {
  outputDir: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output',
  tree: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output\n' +
    '└── cd-ai\n' +
    '    ├── .cd\n' +
    '    │   ├── changelog.json\n' +
    '    │   ├── doc.json\n' +
    '    │   └── roadmap.json\n' +
    '    ├── CHANGELOG.md\n' +
    '    ├── controllers\n' +
    '    │   └── .gitkeep\n' +
    '    ├── .gitignore\n' +
    '    ├── LICENSE\n' +
    '    ├── models\n' +
    '    │   └── .gitkeep\n' +
    '    ├── package.json\n' +
    '    ├── README.md\n' +
    '    └── services\n' +
    '        └── .gitkeep\n' +
    '\n' +
    '6 directories, 11 files\n'
}
[24/08/2025, 22:16:33] [GenComponentService::async():302]: writeFile:start — {
  fullPath: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output/cd-ai/controllers/cd-ai-usage-logs.service.ts',
  action: 1
}
[24/08/2025, 22:16:33] [GenComponentService::async():302]: writeFile:before-tree — {
  outputDir: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output',
  tree: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output\n' +
    '└── cd-ai\n' +
    '    ├── .cd\n' +
    '    │   ├── changelog.json\n' +
    '    │   ├── doc.json\n' +
    '    │   └── roadmap.json\n' +
    '    ├── CHANGELOG.md\n' +
    '    ├── controllers\n' +
    '    │   └── .gitkeep\n' +
    '    ├── .gitignore\n' +
    '    ├── LICENSE\n' +
    '    ├── models\n' +
    '    │   └── .gitkeep\n' +
    '    ├── package.json\n' +
    '    ├── README.md\n' +
    '    └── services\n' +
    '        └── .gitkeep\n' +
    '\n' +
    '6 directories, 11 files\n'
}
[24/08/2025, 22:16:33] [GenComponentService::async():302]: writeFile:start — {
  fullPath: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output/cd-ai/controllers/cd-ai.service.ts',
  action: 1
}
[24/08/2025, 22:16:33] [GenComponentService::async():302]: writeFile:before-tree — {
  outputDir: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output',
  tree: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output\n' +
    '└── cd-ai\n' +
    '    ├── .cd\n' +
    '    │   ├── changelog.json\n' +
    '    │   ├── doc.json\n' +
    '    │   └── roadmap.json\n' +
    '    ├── CHANGELOG.md\n' +
    '    ├── controllers\n' +
    '    │   └── .gitkeep\n' +
    '    ├── .gitignore\n' +
    '    ├── LICENSE\n' +
    '    ├── models\n' +
    '    │   └── .gitkeep\n' +
    '    ├── package.json\n' +
    '    ├── README.md\n' +
    '    └── services\n' +
    '        └── .gitkeep\n' +
    '\n' +
    '6 directories, 11 files\n'
}
[24/08/2025, 22:16:33] [GenComponentService::async():302]: writeFile:start — {
  fullPath: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output/cd-ai/controllers/cd-ai-usage-logs.controller.ts',
  action: 1
}
[24/08/2025, 22:16:33] [GenComponentService::async():302]: writeFile:before-tree — {
  outputDir: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output',
  tree: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output\n' +
    '└── cd-ai\n' +
    '    ├── .cd\n' +
    '    │   ├── changelog.json\n' +
    '    │   ├── doc.json\n' +
    '    │   └── roadmap.json\n' +
    '    ├── CHANGELOG.md\n' +
    '    ├── controllers\n' +
    '    │   └── .gitkeep\n' +
    '    ├── .gitignore\n' +
    '    ├── LICENSE\n' +
    '    ├── models\n' +
    '    │   └── .gitkeep\n' +
    '    ├── package.json\n' +
    '    ├── README.md\n' +
    '    └── services\n' +
    '        └── .gitkeep\n' +
    '\n' +
    '6 directories, 11 files\n'
}
[24/08/2025, 22:16:33] [GenComponentService::async():302]: writeFile:start — {
  fullPath: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output/cd-ai/controllers/cd-ai.controller.ts',
  action: 1
}
[2025-08-24 22:16:33] 🛠️ fs.util::writePrettyFile()/fullPath:/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output/cd-ai/controllers/cd-ai-usage-logs.service.ts
[2025-08-24 22:16:33] 🛠️ fs.util::writePrettyFile()/fullPath:/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output/cd-ai/controllers/cd-ai.service.ts
[2025-08-24 22:16:33] 🛠️ fs.util::writePrettyFile()/fullPath:/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output/cd-ai/controllers/cd-ai-usage-logs.controller.ts
[2025-08-24 22:16:33] 🛠️ fs.util::writePrettyFile()/fullPath:/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output/cd-ai/controllers/cd-ai.controller.ts
⠙ ⏳ Running task 'generateServices' (Attempt 1/1)...✅ Pretty file written: /home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output/cd-ai/models/cd-ai.model.ts
```

```log
[2025-08-24 23:51:57] 🛠️ GenComponentService::resolveOutputFilePath()/config: {
  artifactType: 'controllers',
  templatePath: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/template/abcd/controllers/abcd.controller.js',
  dependencyList: [
    {
      name: 'BaseService',
      category: 'core',
      source: 'local',
      scope: 'module',
      targetApp: 'cd-api',
      isCdModule: false,
      cdCtx: 'sys',
      resolution: [Object],
      usage: [Object]
    },
    {
      name: 'AbcdTypeService',
      category: 'custom',
      source: 'local',
      scope: 'module',
      targetApp: 'cd-api',
      isCdModule: true,
      cdCtx: 'app',
      resolution: [Object],
      usage: [Object]
    },
    {
      name: 'AbcdService',
      category: 'custom',
      source: 'local',
      scope: 'module',
      targetApp: 'cd-api',
      isCdModule: true,
      cdCtx: 'app',
      resolution: [Object],
      usage: [Object]
    }
  ],
  outputPath: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output',
  language: {
    name: 'TypeScript',
    version: '5.0',
    type: 'hybrid',
    fileProfiles: [ [Object], [Object] ],
    languageEcosystem: { defaultPackageManager: 'npm', frameworks: [Array] },
    languageParadigms: { supportsOOP: true, supportsFunctional: true },
    languageTooling: {
      buildTools: [Array],
      testingFrameworks: [Array],
      linters: [Array]
    },
    languageFeatures: {
      staticTyping: true,
      dynamicTyping: false,
      memoryManagement: 'garbageCollection'
    }
  },
  extension: '.ts',
  componentDescriptor: {
    name: 'cd-ai',
    type: 'service',
    methods: [ [Object], [Object], [Object] ],
    dependencies: [ [Object], [Object], [Object] ],
    fileName: 'cd-ai.service.ts'
  },
  componentName: 'cd-ai-usage-logs'
}
[2025-08-24 23:51:57] 🛠️ GenComponentService::resolveOutputFilePath()/expected-resolution: /home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output/cd-ai/controllers/cd-ai.service.ts
[24/08/2025, 23:51:57] [GenComponentService::GenComponentService():395]: resolveOutputPath:opt: — '02'

```

I need a function that can be used to derive PrimaryComponentType from a file name.
Below is a typical set of file names.

cd-ai-usage-logs-type.controller.ts
cd-ai-usage-logs-type.service.ts
cd-ai-usage-logs-type.model.ts

```ts
export enum ComponentType {
  Controller = 'controller',
  ControllerType = 'controller-type',
  Service = 'service',
  ServiceType = 'service-type',
  Model = 'model',
  ModelType = 'model-type',
  ModelView = 'model-view',
  Utility = 'utility',
  Component = 'component',
  Plugin = 'plugin',
}

export type PrimaryComponentType = 'controller' | 'service' | 'model';
export type DerivedSuffix = 'type' | 'view';

export type DerivedComponentType =
  | `${PrimaryComponentType}-${DerivedSuffix}`;
```

---

## COMPLETED TASKS:

---
Milestone:
- imports developed from descriptors working ok
- file naming working ok with all the ComponentType's
- class names and headers working ok

## TASKS IN PROGRESS:

---

- test if imports are correct
  - imports still reading 'abcd'
  - how to configure native import: eg importing service to controller
- set queriable methods
- populate methods for controllers and services
- test cd-ai module
- correct import paths

## TO DO:

---
- auto generate initial methods
- fine tune roadmap for cd-api for actuall testing
- test version auto update for CdApp (cd-api) and CdModule (cd-ai)
- package.json can be downgraded without warning but one should not be able to downgrade in comparison to git records
- package.json was update successfully
- changelog was not updated as expected

## COMMANDS DESIGN AND DEVELOPMENT

---

Command structure

```sh
<DevModeAction> --<ActonTarget as CdObjType.cdObjTypeName> --name <CdObj.dObjName> --o-env <Env as CdObjType.cdObjTypeName> --repo <Repo as CdObj.dObjName>
```

```sh
create --cd-module --name cd-ai --o-env workshop --repo cd-ai;
create --cd-module --name cd-ai --o-env test-bed --repo cd-ai;
update --cd-module --name cd-ai --o-env test-bed --repo cd-ai;

# upgrade cd-api to version 0.8.0. then perform task test after the upgrade (tests would upgrade the project as per the roadmap based on successful tests)
upgrade --cd-app  --name cd-api --o-env test-bed  --repo cd-api --version 0.8.0 --test true;

#upgrade cd-ai module in the workshop to 0.1.0
upgrade --cd-module --name cd-ai --o-env workshop --repo cd-ai --version 0.1.0;

# upgrade cd-ai module to 0.1.1  then perform task test after the upgrade (tests would upgrade the project as per the roadmap based on successful tests)
upgrade --cd-module --name cd-ai --o-env test-bed --repo cd-ai --version 0.1.0 --test true;

```
