/* eslint-disable style/operator-linebreak */
/* eslint-disable no-case-declarations */

/* eslint-disable style/brace-style */
/* eslint-disable node/prefer-global/process */
/* eslint-disable unused-imports/no-unused-vars */

import { CdSchedulerDescriptor } from '../../cd-scheduler/models/cd-scheduler.model.js';
import { CdFxReturn, ICdRequest } from '../../base/index.js';
import { CdObjTypeModel } from '../../moduleman/index.js';
import { AppType, BaseDescriptor } from '../../dev-descriptor/index.js';

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
  cdRequest: ICdRequest;
  enabled?: boolean;
  jsonFile?: string; // optional descriptor file path
  modelFile?: string; // optional model descriptor path
  workstation?: string; // target environment
}

export enum DevModeAction {
  CREATE = 1,
  READ = 2,
  UPDATE = 3,
  DELETE = 4,
  UPGRADE = 5,
  MIGRATE = 6,
}



/**
 * Selected CdObjTypes from corpdesk database that are relevant to application cdevelopment automation
 */
export const actionTargets: CdObjTypeModel[] = [
  {
    cdObjTypeId: 3,
    cdObjTypeName: 'module',
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
//         m: 'mod-craft',
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
  moduleName: string,
  moduleType: AppType,
): CdFxReturn<IDevModeInstructionDescriptor[]> {
  const actionStr = getActionString(action);    // e.g., 'update'
  const actionLabel = getActionLabel(action);  // e.g., 'Update'

  const devModInstructions: IDevModeInstructionDescriptor[] = [];

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
      requiredOptions: ['name', 'type'],
      targetName: moduleName,
      targetType: moduleType,
      cdRequest: {
        ctx: 'app',
        m: 'mod-craft',
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
      message: 'No valid DevMode instructions could be generated. Check modCraftController mappings.',
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
        m: 'mod-craft',
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
        m: 'mod-craft',
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
        m: 'mod-craft',
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
        m: 'mod-craft',
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
