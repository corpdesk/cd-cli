import { inspect } from 'util';
import { BaseService } from '../../base/base.service.js';
import { CdFxReturn, ICdRequest } from '../../base/IBase.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { AppType } from '../../dev-descriptor/index.js';
import { SessionService } from '../../user/index.js';
import {
  actionTargets,
  DevModeAction,
  getRegistry,
  IDevModeInstructionDescriptor,
} from '../models/dev-mode.model.js';

export class DevModeService {
  /**
   * A generic execution method executed at any subcommand file
   * The context of file is based on registered DevModAction options
   * @param action  // action is of data type DevModAction see sdk/docs/dev_mode_action_verb_semantics.md
   * @param options // command options
   * @returns
   */
  // async executeCrudCommand(action: DevModeAction, options: any): Promise<CdFxReturn<null>> {
  //   const { name, type } = options;

  //   CdLog.debug(`[executeCrudCommand] action=${DevModeAction[action]}, name=${name}, type=${type}`);

  //   if (!name || !type) {
  //     CdLog.debug(`[executeCrudCommand] Missing required options.`);
  //     return {
  //       state: false,
  //       data: null,
  //       message: '❌ Missing --name or --type.',
  //     };
  //   }

  //   let registryResult: CdFxReturn<IDevModeInstructionDescriptor[]>;
  //   try {
  //     registryResult = await this.getRegistryForCdObj(action, type, name);
  //   } catch (err: any) {
  //     CdLog.debug(`[executeCrudCommand] getRegistryForCdObj failed: ${err.message}`);
  //     return {
  //       state: false,
  //       data: null,
  //       message: `❌ ${err.message}`,
  //     };
  //   }

  //   if (!registryResult.state || !registryResult.data) {
  //     CdLog.debug(`[executeCrudCommand] Invalid registry: ${registryResult.message}`);
  //     return {
  //       state: false,
  //       data: null,
  //       message: registryResult.message || '❌ Invalid registry.',
  //     };
  //   }

  //   const registry = registryResult.data;
  //   const selectedItem = registry.find((item) => options[item.flag]);
  //   CdLog.debug(`[executeCrudCommand] Matching item: ${JSON.stringify(selectedItem, null, 2)}`);

  //   if (!selectedItem) {
  //     return {
  //       state: false,
  //       data: null,
  //       message: `❌ Invalid item to ${DevModeAction[action].toLowerCase()}.`,
  //     };
  //   }

  //   const missing = selectedItem.requiredOptions.filter((key) => !options[key]);
  //   if (missing.length > 0) {
  //     CdLog.debug(`[executeCrudCommand] Missing required options: ${missing.join(', ')}`);
  //     return {
  //       state: false,
  //       data: null,
  //       message: `❌ Missing required options: ${missing.join(', ')}`,
  //     };
  //   }

  //   try {
  //     const sessionService = new SessionService();
  //     const cdToken = await sessionService.sessData.cdToken;

  //     // constructed the request based on registry data
  //     const request: ICdRequest = {
  //       ...selectedItem.cdRequest,
  //       dat: {
  //         ...selectedItem.cdRequest.dat,
  //         token: cdToken,
  //       },
  //       args: {
  //         name,
  //         type,
  //         ...(options.method && { method: options.method }),
  //       },
  //     };

  //     CdLog.debug(`[executeCrudCommand] Final request: ${JSON.stringify(request, null, 2)}`);

  //     const b = new BaseService();
  //     /**
  //      * The request targets app-craft module
  //      * Typical request:
  //      * {
  //             "ctx": "app",         // <-- context constant due to targe module
  //             "m": "app-craft",     // <-- module target constant
  //             "c": "CdModule",      // <-- controller determined by the --type option. It is expected to be selected from  CdObjType data
  //             "a": "create",        // <-- action is of data type DevModAction see sdk/docs/dev_mode_action_verb_semantics.md
  //             "dat": {
  //                 "f_vals": [
  //                     {
  //                         "data": null
  //                     }
  //                 ],
  //                 "token": ""
  //             },
  //             "args": {             // <-- aguments
  //                 "name": "cd-ai",  // <-- provided by the --name option
  //                 "type": "cd-api"  // <-- provided by the --type option
  //             }
  //         }
  //      */
  //     const response = await b.invokeCdRequest(request);

  //     CdLog.debug(`[executeCrudCommand] Service response: ${JSON.stringify(response, null, 2)}`);

  //     if (response?.state) {
  //       return {
  //         state: true,
  //         data: null,
  //         message: `✔ ${selectedItem.label} "${name}" ${DevModeAction[action].toLowerCase()}d successfully.`,
  //       };
  //     } else {
  //       return {
  //         state: false,
  //         data: null,
  //         message: `❌ Failed to ${DevModeAction[action].toLowerCase()} ${selectedItem.label}: ${response.message}`,
  //       };
  //     }
  //   } catch (err: any) {
  //     CdLog.debug(`[executeCrudCommand] Exception during request: ${err.message}`);
  //     return {
  //       state: false,
  //       data: null,
  //       message: `❌ Error during ${DevModeAction[action].toLowerCase()}: ${err.message}`,
  //     };
  //   }
  // }
  async executeCrudCommand(action: DevModeAction, options: any): Promise<CdFxReturn<null>> {
    const { name, type } = options;
    CdLog.debug(
      `DevModeService::executeCrudCommand() action=${DevModeAction[action]}, name=${name}, type=${type}, options=${inspect(options, { depth: 2 })}`,
    );
    CdLog.debug(`[executeCrudCommand] action=${DevModeAction[action]}, name=${name}, type=${type}`);

    if (!name || !type) {
      CdLog.debug(`[executeCrudCommand] Missing required options.`);
      return {
        state: false,
        data: null,
        message: '❌ Missing --name or --type.',
      };
    }

    const selectedTarget = actionTargets.find((t) => options[t.cdObjTypeName]);
    if (!selectedTarget) {
      return {
        state: false,
        data: null,
        message: '❌ No valid object type (e.g., --cd-module, --model) specified.',
      };
    }

    const actionTargetName = selectedTarget.cdObjTypeName;

    let registryResult: CdFxReturn<IDevModeInstructionDescriptor[]>;
    try {
      registryResult = await this.getRegistryForCdObj(action, actionTargetName, type, name);
    } catch (err: any) {
      CdLog.debug(`[executeCrudCommand] getRegistryForCdObj failed: ${err.message}`);
      return {
        state: false,
        data: null,
        message: `❌ ${err.message}`,
      };
    }

    if (!registryResult.state || !registryResult.data) {
      CdLog.debug(`[executeCrudCommand] Invalid registry: ${registryResult.message}`);
      return {
        state: false,
        data: null,
        message: registryResult.message || '❌ Invalid registry.',
      };
    }

    const registry = registryResult.data;
    const selectedItem = registry.find((item) => options[item.flag]);

    CdLog.debug(`[executeCrudCommand] Matching item: ${JSON.stringify(selectedItem, null, 2)}`);

    if (!selectedItem) {
      return {
        state: false,
        data: null,
        message: `❌ Invalid item to ${DevModeAction[action].toLowerCase()}.`,
      };
    }

    const missing = selectedItem.requiredOptions.filter((key) => !options[key]);
    if (missing.length > 0) {
      CdLog.debug(`[executeCrudCommand] Missing required options: ${missing.join(', ')}`);
      return {
        state: false,
        data: null,
        message: `❌ Missing required options: ${missing.join(', ')}`,
      };
    }

    try {
      const sessionService = new SessionService();
      const cdToken = await sessionService.sessData.cdToken;

      // Generic + dynamic argument handling
      const args = this.buildCdRequestArgs({actionTargetName, name, type }, options, selectedItem);
      CdLog.debug(
        `DevModeService::executeCrudCommand()/cleaned args: ${inspect(args, { depth: 2 })}`,
      );

      const request: ICdRequest = {
        ...selectedItem.cdRequest,
        dat: {
          ...selectedItem.cdRequest.dat,
          token: cdToken,
        },
        args,
      };

      CdLog.debug(
        `DevModeService::executeCrudCommand()/request: ${inspect(request, { depth: 2 })}`,
      );

      const b = new BaseService();
      const response = await b.invokeCdRequest(request);

      CdLog.debug(`[executeCrudCommand] Service response: ${JSON.stringify(response, null, 2)}`);

      if (response?.state) {
        return {
          state: true,
          data: null,
          message: `✔ ${selectedItem.label} "${name}" ${DevModeAction[action].toLowerCase()}d successfully.`,
        };
      } else {
        return {
          state: false,
          data: null,
          message: `❌ Failed to ${DevModeAction[action].toLowerCase()} ${selectedItem.label}: ${response.message}`,
        };
      }
    } catch (err: any) {
      CdLog.debug(`[executeCrudCommand] Exception during request: ${err.message}`);
      return {
        state: false,
        data: null,
        message: `❌ Error during ${DevModeAction[action].toLowerCase()}: ${err.message}`,
      };
    }
  }

  buildCdRequestArgs(
    baseOptions: Record<string, any>,
    cliOptions: Record<string, any>,
    selectedItem: IDevModeInstructionDescriptor,
  ): Record<string, any> {
    const args: Record<string, any> = {
      actionTargetName: baseOptions.actionTargetName,
      name: baseOptions.name,
      type: baseOptions.type,
      ...(cliOptions.method && { method: cliOptions.method }),
    };

    const knownKeys = new Set<string>([
      'cdObjTypeName',
      'name',
      'type',
      'method',
      ...(selectedItem.requiredOptions ?? []),
      ...(selectedItem.optionalOptions ?? []),
    ]);

    for (const [key, value] of Object.entries(cliOptions)) {
      if (key === '_') continue; // skip yargs positional
      if (value === true && !knownKeys.has(key)) continue; // skip noise flags like --cd-app
      args[key] = value;
    }

    CdLog.debug(
      `DevModeService::buildCdRequestArgs()/cleaned args: ${inspect(args, { depth: 2 })}`,
    );
    return args;
  }

  /**
   *
   * Get registry base on action, type and name
   *
   * @param action
   * @param cdObjType
   * @param cdObjName
   * @returns
   */
  async getRegistryForCdObj(
    action: DevModeAction, // listed action types as per cd-cli syntax // see sdk/docs/dev_mode_action_verb_semantics.md
    actionTargetName: string, // CdObjType.cdObjTypeName from actionTarget data e.g., 'cd-module', 'cd-api', etc.
    cdObjType: AppType | string, // As per CdObjType records. Can also bee regarded as action target. eg app, module, test-bed, sandbox
    cdObjName: string, // name of the CdObj eg app called cd-api, module named cd-ai, test-bed named cd-ai
  ): Promise<CdFxReturn<IDevModeInstructionDescriptor[]>> {
    CdLog.debug(
      `DevModeService::getRegistryForCdObj() action=${DevModeAction[action]}, actionTargetName=${actionTargetName}, cdObjType=${cdObjType}, cdObjName=${cdObjName}`,
    );
    const modTypeStr =
      typeof cdObjType === 'string' ? cdObjType : (cdObjType as AppType).toString().toLowerCase();

    const filePath = `../../../app/app-craft/workshop/${modTypeStr}/workflow/${actionTargetName}/${cdObjName}-workshop.model.js`;

    CdLog.debug(`[getRegistryForCdObj] Locating registry file at: ${filePath}`);
    CdLog.debug(
      `[getRegistryForCdObj] action=${DevModeAction[action]}, cdObjName=${cdObjName}, cdObjType=${cdObjType}`,
    );

    try {
      const module = await import(filePath);
      if (!module.getItemRegistry) {
        CdLog.debug(`[getRegistryForCdObj] Missing getItemRegistry export in module: ${filePath}`);
        return {
          state: false,
          data: null,
          message: `❌ Missing getItemRegistry export in ${filePath}`,
        };
      }

      const result: CdFxReturn<IDevModeInstructionDescriptor[]> = module.getItemRegistry(
        action,
        cdObjName,
        cdObjType,
      );

      CdLog.debug(`[getRegistryForCdObj] Result: ${JSON.stringify(result, null, 1)}`);

      if (!result?.state) {
        CdLog.debug(`[getRegistryForCdObj] Registry fetch failed: ${result.message}`);
        return {
          state: false,
          data: null,
          message: result.message || '❌ Failed to generate registry instructions.',
        };
      }

      return result;
    } catch (err: any) {
      CdLog.debug(`[getRegistryForCdObj] Exception caught: ${err.message}`);
      return {
        state: false,
        data: null,
        message: `❌ Failed to load registry for module "${cdObjName}" of type "${cdObjType}": ${err.message}`,
      };
    }
  }

  async getCreateRegistryForCdObj(
    actionTargetName: string, // CdObjType.cdObjTypeName from actionTarget data e.g., 'cd-module', 'cd-api', etc.
    cdObjType: AppType | string,
    cdObjName: string,
  ): Promise<CdFxReturn<IDevModeInstructionDescriptor[]>> {
    return this.getRegistryForCdObj(DevModeAction.CREATE, actionTargetName, cdObjType, cdObjName);
  }

  async getRegistryByAction(
    action: DevModeAction,
    cdObjType: AppType,
    cdObjName: string,
  ): Promise<CdFxReturn<IDevModeInstructionDescriptor[]>> {
    return getRegistry(action, cdObjName, cdObjType);
  }
}
