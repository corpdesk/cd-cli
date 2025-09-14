/* eslint-disable style/operator-linebreak */
/* eslint-disable no-case-declarations */

/* eslint-disable style/brace-style */
/* eslint-disable node/prefer-global/process */
/* eslint-disable unused-imports/no-unused-vars */

import { CdSchedulerDescriptor } from '../../cd-scheduler/models/cd-scheduler.model.js';
import { CdFxReturn, ICdRequest } from '../../base/index.js';
import { CdObjTypeModel } from '../../moduleman/index.js';
import { AppType, BaseDescriptor, CdEnvName } from '../../dev-descriptor/index.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';

export interface DevModeModel {
  method: 'wizard' | 'manual' | 'ai' | 'json' | 'context';
  process: 'create' | 'read' | 'update' | 'delete';
  workflow: CdSchedulerDescriptor;
}

// DevMode is the module that manages REPL mode for cd-cli
// This interface is used to constrain the syntaxt policy for the commands
export interface IDevModeInstructionDescriptor extends BaseDescriptor {
  flag: string;
  label: string;
  action: DevModeAction; // e.g., CRUD options, migrate, upgrade
  actionTarget?: CdObjTypeModel; // e.g., In principle any CdObj item for corpdesk should qualify
  targetName: string; // e.g., 'cd-ai' <-- specific application name
  targetType?: AppType; // e.g., 'cd-api' <-- the specific CdObjType item
  execStrategy?: 'json' | 'context' | 'gui-wizard' | 'ai' | 'cmd'; // action strategy
  requiredOptions: string[];
  optionalOptions?: string[];
  cdRequest: ICdRequest;
  enabled?: boolean;
  jsonFile?: string; // optional descriptor file path
  modelFile?: string; // optional model descriptor path
  workstation?: string; // target environment
}

export interface CdOutputEnvModel {
  name: CdEnvName;
  label: string;
  context: 'local' | 'testing' | 'production' | 'custom';
}

/**
 * See the document: sdk/docs/dev_mode_action_verb_semantics.md
 * for the design and principles
 */
export enum DevModeAction {
  /**
   * Data Access & Manipulation Verbs
   */
  CREATE = 1,
  READ = 2,
  UPDATE = 3,
  DELETE = 4,
  DERIVE = 16, // e.g., derive CdObj from an existing source, like a module descriptor or workflow model

  GET = 17, // e.g., get query
  GET_PAGED = 18, // get query with pagination

  /**
   * workflow-oriented verbs are a class of directional actions in
   * system lifecycles, and their semantics can deeply enrich both
   * CLI usability and AI integration later
   */
  // Directional Lifecycle
  UPGRADE = 5,
  MIGRATE = 6,
  DEGRADE = 7,
  REGRESS = 8,
  PROMOTE = 9,
  DEMOTE = 10,

  // Branching/Divergence
  MERGE = 11,
  FORK = 12,
  BRANCH = 13,

  // Finalization
  RELEASE = 14,
  PACKAGE = 15,
}

// export const SHARED_OPTIONS = [
//   { flags: 'name', description: 'Name of the item to process' },
//   { flags: 'type', description: 'Type of the module (e.g. cd-api, cd-ui)' },
//   { flags: 'json-file', description: 'Path to JSON module descriptor file' },
//   { flags: 'model-file', description: 'Path to JSON workflow model file' },
//   { flags: 'workstation', description: 'Target workstation' },
// ];
export const SHARED_OPTIONS = [
  { flags: 'name', description: 'Name of the item to process' },
  { flags: 'proj', description: 'Name of the registered project' },
  { flags: 'o-env', description: 'Target output environment (e.g. workshop, test-bed)' },
  { flags: 'json-file', description: 'Path to JSON module descriptor file' },
  { flags: 'model-file', description: 'Path to JSON workflow model file' },
  { flags: 'workstation', description: 'Target workstation' },
];

// export const UPGRADE_EXTRA_OPTIONS = [
//   { flags: 'roadmap', description: 'id of roadmap to upgrade' },
//   { flags: 'milestone', description: 'id of milestone to upgrade' },
// ];

export const UPGRADE_EXTRA_OPTIONS = [
  { flags: 'version', description: 'semantic version or git sha to upgrade to' },
  { flags: 'roadmap', description: 'optional override of roadmap id' },
  { flags: 'milestone', description: 'optional override of milestone id' },
  { flags: 'test', description: 'optional for running task tests and version update' },
];

/**
 * Selected CdObjTypes from corpdesk database that are relevant to application cdevelopment automation
 */
export const actionTargets: CdObjTypeModel[] = [
  {
    cdObjTypeId: 3,
    cdObjTypeName: 'cd-module',
    cdObjTypeGuid: '8b4cf8de-1ffc-4575-9e73-4ccf45a7756b',
    modCraftController: 'CdModule',
  },
  {
    cdObjTypeId: 5,
    cdObjTypeName: 'model',
    cdObjTypeGuid: 'f028f009-1a2d-40d4-b284-645c855ad04c',
    modCraftController: 'CdModel',
  },
  {
    cdObjTypeId: 6,
    cdObjTypeName: 'controller',
    cdObjTypeGuid: 'cbbd698d-34a9-4982-a75a-cfe7797c1d00',
    modCraftController: 'CdController',
  },
  {
    cdObjTypeId: 8,
    cdObjTypeName: 'action',
    cdObjTypeGuid: '55ffe474-f46b-452b-9a13-01c258995cdb',
    modCraftController: 'CdAction',
  },
  {
    cdObjTypeId: 33,
    cdObjTypeName: 'cd-app',
    cdObjTypeGuid: 'd6507c5d-a7ca-41fb-ad5f-dc5ceba46489',
    modCraftController: 'CdApp',
  },
  {
    cdObjTypeId: 34,
    cdObjTypeName: 'package',
    cdObjTypeGuid: 'cb35a1da-51b5-41a6-a147-4798de7b3b38',
    modCraftController: 'Package',
  },
  {
    cdObjTypeId: 126,
    cdObjTypeName: 'test-bed',
    cdObjTypeGuid: '8bf59db2-a2c2-4da0-ad28-bce77c022ce5',
    modCraftController: 'TestBed',
  },
  {
    cdObjTypeId: 127,
    cdObjTypeName: 'production',
    cdObjTypeGuid: '010ef125-937a-4e7a-b571-2be23976946d',
    modCraftController: 'Production',
  },
  {
    cdObjTypeId: 128,
    cdObjTypeName: 'package',
    cdObjTypeGuid: '54b178d5-fc96-4aaf-97c7-c37a9c8c3f84',
    modCraftController: 'Package',
  },
  {
    cdObjTypeId: 129,
    cdObjTypeName: 'sandbox',
    cdObjTypeGuid: 'aa943c76-1998-4165-ab75-4424c9755587',
    modCraftController: 'Sandbox',
  },
  {
    cdObjTypeId: 130,
    cdObjTypeName: 'method',
    cdObjTypeGuid: '647e5383-e9bc-447c-944c-39b892670711',
    modCraftController: 'CdMethod',
  },
  {
    cdObjTypeId: 131,
    cdObjTypeName: 'dev-roadmap',
    cdObjTypeGuid: '2c132caa-bde3-404f-884c-e6abe6257b1d',
    modCraftController: 'DevRoadmap',
  },
  {
    cdObjTypeId: 132,
    cdObjTypeName: 'dev-doc',
    cdObjTypeGuid: 'f8705dbb-814b-4649-8a44-f9d43d1fdba4',
    modCraftController: 'DevDoc',
  },
  {
    cdObjTypeId: 133,
    cdObjTypeName: 'dev-changelog',
    cdObjTypeGuid: 'f38a4627-32e9-44fc-9b22-dbab38d2735b',
    modCraftController: 'DevChangelog',
  },
  {
    cdObjTypeId: 134,
    cdObjTypeName: 'cd-api',
    cdObjTypeGuid: 'c3279848-312d-42fa-91f0-0be2e27052d1',
    modCraftController: 'CdApi',
  },
  {
    cdObjTypeId: 200,
    cdObjTypeName: 'frontend',
    cdObjTypeGuid: '23efab2b-1f61-40f5-a84d-6f9978b57e57',
    modCraftController: 'Frontend',
  },
  {
    cdObjTypeId: 201,
    cdObjTypeName: 'api',
    cdObjTypeGuid: 'c9677cd1-4e4e-46fd-958c-e60f59f82bd1',
    modCraftController: 'Api',
  },
  {
    cdObjTypeId: 203,
    cdObjTypeName: 'cd-module',
    cdObjTypeGuid: 'f6bc1cf9-bdef-4ad1-837e-1e0ce29eb104',
    modCraftController: 'CdModule',
  },
  {
    cdObjTypeId: 204,
    cdObjTypeName: 'push-server',
    cdObjTypeGuid: '4d1d69de-06f2-41f6-b4f4-6db16091f6f1',
    modCraftController: 'PushServer',
  },
  {
    cdObjTypeId: 205,
    cdObjTypeName: 'cli',
    cdObjTypeGuid: 'f3d9bc12-3cd4-4ac0-a3b4-e6744a6495d6',
    modCraftController: 'Cli',
  },
  {
    cdObjTypeId: 206,
    cdObjTypeName: 'cd-cli',
    cdObjTypeGuid: '9aab01ec-bce7-49c3-a2b5-3e697ac9b20e',
    modCraftController: 'CdCli',
  },
  {
    cdObjTypeId: 207,
    cdObjTypeName: 'pwa',
    cdObjTypeGuid: '6e0b5a1a-08df-476b-8a1f-17d45017d96c',
    modCraftController: 'Pwa',
  },
  {
    cdObjTypeId: 208,
    cdObjTypeName: 'desktop-pwa',
    cdObjTypeGuid: 'c9bce40d-7a98-49ee-a875-3b476a982057',
    modCraftController: 'DesktopPwa',
  },
  {
    cdObjTypeId: 209,
    cdObjTypeName: 'mobile',
    cdObjTypeGuid: '0f6f3342-35dc-47f5-a7d7-3f456f9a83cd',
    modCraftController: 'Mobile',
  },
  {
    cdObjTypeId: 210,
    cdObjTypeName: 'mobile-hybrid',
    cdObjTypeGuid: 'b39bcd3f-1966-4c70-b594-5fd5b09cb8c2',
    modCraftController: 'MobileHybrid',
  },
  {
    cdObjTypeId: 211,
    cdObjTypeName: 'mobile-native',
    cdObjTypeGuid: 'ebfa4828-2e7e-4bde-a2d4-1455d038b59c',
    modCraftController: 'MobileNative',
  },
  {
    cdObjTypeId: 212,
    cdObjTypeName: 'desktop',
    cdObjTypeGuid: '9992f62b-b700-4d00-aab3-dcf236780f57',
    modCraftController: 'Desktop',
  },
  {
    cdObjTypeId: 213,
    cdObjTypeName: 'iot',
    cdObjTypeGuid: '726ea70f-86f5-4657-b75c-607f57dc7ae2',
    modCraftController: 'Iot',
  },
  {
    cdObjTypeId: 214,
    cdObjTypeName: 'game',
    cdObjTypeGuid: '4d53c30b-2249-4c25-aef0-b444dbf26077',
    modCraftController: 'Game',
  },
  {
    cdObjTypeId: 215,
    cdObjTypeName: 'embedded',
    cdObjTypeGuid: '22c94ed7-4b2e-4b21-90cf-fba2c1d83699',
    modCraftController: 'Embedded',
  },
  {
    cdObjTypeId: 216,
    cdObjTypeName: 'robotics',
    cdObjTypeGuid: '6c1e7402-ea47-4dbe-8001-6f1505f46aa6',
    modCraftController: 'Robotics',
  },
  {
    cdObjTypeId: 217,
    cdObjTypeName: 'plugin',
    cdObjTypeGuid: '6c98fc1f-8137-4967-a6bb-c84d89175526',
    modCraftController: 'Plugin',
  },
  {
    cdObjTypeId: 218,
    cdObjTypeName: 'microservice',
    cdObjTypeGuid: '0c1e3f44-126c-4bb1-a1a3-95e9b6d700be',
    modCraftController: 'Microservice',
  },
  {
    cdObjTypeId: 219,
    cdObjTypeName: 'sdn',
    cdObjTypeGuid: '7d63ae7a-60bb-4bfa-82aa-1c8c14269a26',
    modCraftController: 'Sdn',
  },
  {
    cdObjTypeId: 220,
    cdObjTypeName: 'cbo',
    cdObjTypeGuid: '96cf624b-1bd5-4471-9ae2-1dc258e40992',
    modCraftController: 'Cbo',
  },
];

/**
 * Converts an enum value (e.g. DevModeAction.UPDATE) to lowercase string: 'update'
 */
export function getActionString(action: DevModeAction): string {
  return DevModeAction[action].toLowerCase();
}

/**
 * Converts an enum value to Title Case: 'Update', 'Create'
 */
export function getActionLabel(action: DevModeAction): string {
  const raw = getActionString(action);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// export function getRegistry(
//   action: DevModeAction,
//   moduleName: string,
//   moduleType: AppType,
// ): CdFxReturn<IDevModeInstructionDescriptor[]> {
//   const actionStr = getActionString(action); // e.g. 'update'
//   const actionLabel = getActionLabel(action); // e.g. 'Update'

//   const devModInstructions: IDevModeInstructionDescriptor[] = [];

//   for (const t of actionTargets) {
//     if (!t.modCraftController) {
//       return {
//         state: false,
//         data: null,
//         message: `Controller data is invalid`,
//       };
//     }
//     devModInstructions.push({
//       name: t.cdObjTypeName,
//       flag: t.cdObjTypeName,
//       label: t.cdObjTypeName,
//       description: `${actionLabel} a developer ${t.cdObjTypeName} environment`,
//       action,
//       actionTarget: t,
//       requiredOptions: ['name', 'type'],
//       targetName: moduleName,
//       targetType: moduleType,
//       cdRequest: {
//         ctx: 'app',
//         m: 'app-craft',
//         c: t.modCraftController, // options: CdModule, TestBed, CdController...any equivalent of what is available in the CdObjTypeNames
//         a: actionStr,
//         dat: {
//           f_vals: [{ data: null }],
//           token: '',
//         },
//         args: null,
//       },
//     });
//   }

//   return devModInstructions;
// }

export function getRegistry(
  action: DevModeAction,
  cdObjName: string,
  appType: AppType,
  actionTargetName: string,
): CdFxReturn<IDevModeInstructionDescriptor[]> {
  CdLog.debug(`DevModeModel::getRegistry()/action:${action}`)
  CdLog.debug(`DevModeModel::getRegistry()/cdObjName:${cdObjName}`)
  CdLog.debug(`DevModeModel::getRegistry()/appType:${appType}`)
  CdLog.debug(`DevModeModel::getRegistry()/actionTargetName:${actionTargetName}`)
  const actionStr = getActionString(action); // e.g., 'update'
  CdLog.debug(`DevModeModel::getRegistry()/actionStr:${actionStr}`)
  const actionLabel = getActionLabel(action); // e.g., 'Update'
  CdLog.debug(`DevModeModel::getRegistry()/actionLabel:${actionLabel}`)
  const devModInstructions: IDevModeInstructionDescriptor[] = [];

  // actionTargets is defined as export const actionTargets: CdObjTypeModel[] in the file:
  // src/CdCli/sys/dev-mode/models/dev-mode.model.ts
  for (const t of actionTargets) {
    if (!t.modCraftController) {
      console.warn(`⚠️ Skipping target "${t.cdObjTypeName}" — missing modCraftController`);
      continue;
    }

    devModInstructions.push({
      name: t.cdObjTypeName,
      flag: t.cdObjTypeName,
      label: t.cdObjTypeName,
      description: `${actionLabel} a developer ${t.cdObjTypeName} environment`,
      action,
      actionTarget: t,
      requiredOptions: ['name', 'o-env'],
      // optionalOptions: ['roadmap', 'milestone'],
      targetName: cdObjName,
      targetType: appType,
      cdRequest: {
        ctx: 'app',
        m: 'app-craft',
        c: t.modCraftController, // dynamic controller from CdObjTypeModel
        a: actionStr,
        dat: {
          f_vals: [{ data: null }],
          token: '',
        },
        args: null,
      },
    });
  }

  if (devModInstructions.length === 0) {
    return {
      state: false,
      data: null,
      message:
        'No valid DevMode instructions could be generated. Check modCraftController mappings.',
    };
  }

  return {
    state: true,
    data: devModInstructions,
    message: `${actionLabel} registry generated successfully`,
  };
}

export function getCreateRegistry(
  moduleName: string,
  moduleType: AppType,
): IDevModeInstructionDescriptor[] {
  const action = DevModeAction.CREATE;
  const actionStr = getActionString(action); // 'update'
  const actionLabel = getActionLabel(action); // 'Update'

  const devModInstructions: IDevModeInstructionDescriptor[] = [];

  for (const t of actionTargets) {
    devModInstructions.push({
      name: t.cdObjTypeName,
      flag: t.cdObjTypeName,
      label: t.cdObjTypeName,
      description: `${actionLabel} a developer ${t.cdObjTypeName} environment`,
      action,
      actionTarget: t,
      requiredOptions: ['name', 'type'],
      targetName: moduleName,
      targetType: moduleType,
      cdRequest: {
        ctx: 'app',
        m: 'app-craft',
        c: 'TestBed',
        a: actionStr, // ← 'update'
        dat: {
          f_vals: [{ data: null }],
          token: '',
        },
        args: null,
      },
    });
  }

  return devModInstructions;
}

export function getReadRegistry(
  moduleName: string,
  moduleType: AppType,
): IDevModeInstructionDescriptor[] {
  const action = DevModeAction.READ;
  const actionStr = getActionString(action); // 'update'
  const actionLabel = getActionLabel(action); // 'Update'

  const devModInstructions: IDevModeInstructionDescriptor[] = [];

  for (const t of actionTargets) {
    devModInstructions.push({
      name: t.cdObjTypeName,
      flag: t.cdObjTypeName,
      label: t.cdObjTypeName,
      description: `${actionLabel} a developer ${t.cdObjTypeName} environment`,
      action,
      actionTarget: t,
      requiredOptions: ['name', 'type'],
      targetName: moduleName,
      targetType: moduleType,
      cdRequest: {
        ctx: 'app',
        m: 'app-craft',
        c: 'TestBed',
        a: actionStr, // ← 'update'
        dat: {
          f_vals: [{ data: null }],
          token: '',
        },
        args: null,
      },
    });
  }

  return devModInstructions;
}

export function getUpdateRegistry(
  moduleName: string,
  moduleType: AppType,
): IDevModeInstructionDescriptor[] {
  const action = DevModeAction.UPDATE;
  const actionStr = getActionString(action); // 'update'
  const actionLabel = getActionLabel(action); // 'Update'

  const devModInstructions: IDevModeInstructionDescriptor[] = [];

  for (const t of actionTargets) {
    devModInstructions.push({
      name: t.cdObjTypeName,
      flag: t.cdObjTypeName,
      label: t.cdObjTypeName,
      description: `${actionLabel} a developer ${t.cdObjTypeName} environment`,
      action,
      actionTarget: t,
      requiredOptions: ['name', 'type'],
      targetName: moduleName,
      targetType: moduleType,
      cdRequest: {
        ctx: 'app',
        m: 'app-craft',
        c: 'TestBed',
        a: actionStr, // ← 'update'
        dat: {
          f_vals: [{ data: null }],
          token: '',
        },
        args: null,
      },
    });
  }

  return devModInstructions;
}

export function getDeleteRegistry(
  moduleName: string,
  moduleType: AppType,
): IDevModeInstructionDescriptor[] {
  const action = DevModeAction.DELETE;
  const actionStr = getActionString(action); // 'update'
  const actionLabel = getActionLabel(action); // 'Update'

  const devModInstructions: IDevModeInstructionDescriptor[] = [];

  for (const t of actionTargets) {
    devModInstructions.push({
      name: t.cdObjTypeName,
      flag: t.cdObjTypeName,
      label: t.cdObjTypeName,
      description: `${actionLabel} a developer ${t.cdObjTypeName} environment`,
      action,
      actionTarget: t,
      requiredOptions: ['name', 'type'],
      targetName: moduleName,
      targetType: moduleType,
      cdRequest: {
        ctx: 'app',
        m: 'app-craft',
        c: 'TestBed',
        a: actionStr, // ← 'update'
        dat: {
          f_vals: [{ data: null }],
          token: '',
        },
        args: null,
      },
    });
  }

  return devModInstructions;
}
