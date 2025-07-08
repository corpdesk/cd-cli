import { BaseService } from '../../base/base.service.js';
import { CdFxReturn, ICdRequest } from '../../base/IBase.js';
import { AppType } from '../../dev-descriptor/index.js';
import { SessionService } from '../../user/index.js';
import {
  DevModeAction,
  getRegistry,
  IDevModeInstructionDescriptor,
} from '../models/dev-mode.model.js';

// export class DevModeService {
//   async getCreateRegistryForModule(
//     moduleType: AppType | string,
//     moduleName: string,
//   ): Promise<IDevModeInstructionDescriptor[]> {
//     const modTypeStr =
//       typeof moduleType === 'string'
//         ? moduleType
//         : (moduleType as AppType).toString().toLowerCase();
//     const filePath = `../../../app/mod-craft/workshop/${modTypeStr}/workflow/${moduleName}-workshop.model.js`;
//     try {
//       const module = await import(filePath);
//       if (!module.createItemRegistry) {
//         throw new Error(`No createItemRegistry export found in ${filePath}`);
//       }
//       return module.createItemRegistry as IDevModeInstructionDescriptor[];
//     } catch (err: any) {
//       throw new Error(
//         `Failed to load create registry for module "${moduleName}" of type "${moduleType}": ${err.message}`,
//       );
//     }
//   }

//   async getRegistryForModule(
//     action: DevModeAction,
//     moduleType: AppType | string,
//     moduleName: string,
//   ): Promise<IDevModeInstructionDescriptor[]> {
//     /**
//      * dynamically invoke getRegistry(action, moduleName, moduleType) from the mod-craf workshop to get
//      * the dynamically prepared options based on action, moduleType and moduleName
//      */
//     const modTypeStr =
//       typeof moduleType === 'string'
//         ? moduleType
//         : (moduleType as AppType).toString().toLowerCase();
//     const filePath = `../../../app/mod-craft/workshop/${modTypeStr}/workflow/${moduleName}-workshop.model.js`;
//     try {
//       const module = await import(filePath);
//       if (!module.getItemRegistry(action, moduleName, moduleType)) {
//         throw new Error(`No createItemRegistry export found in ${filePath}`);
//       }
//       // return module.createItemRegistry as IDevModeInstructionDescriptor[];
//       return module.getItemRegistry(action, moduleName, moduleType);
//     } catch (err: any) {
//       throw new Error(
//         `Failed to load create registry for module "${moduleName}" of type "${moduleType}": ${err.message}`,
//       );
//     }
//   }

//   async executeCrudCommand(action: DevModeAction, options: any) {
//     const { name, type } = options;

//     if (!name || !type) {
//       console.log(chalk.red('❌ Missing --name or --type.'));
//       return;
//     }

//     let registry: IDevModeInstructionDescriptor[];

//     try {
//       const svDevMode = new DevModeService();
//       registry = await this.getRegistryForModule(action, type, name); // ← make this method generic
//     } catch (err: any) {
//       console.log(chalk.red(`❌ ${err.message}`));
//       return;
//     }

//     const selectedItem = registry.find((item) => options[item.flag]);
//     if (!selectedItem) {
//       console.log(chalk.red(`❌ Invalid item to ${DevModeAction[action].toLowerCase()}.`));
//       return;
//     }

//     const missing = selectedItem.requiredOptions.filter((key) => !options[key]);
//     if (missing.length > 0) {
//       console.log(chalk.red(`❌ Missing required options: ${missing.join(', ')}`));
//       return;
//     }

//     try {
//       const sessionService = new SessionService();
//       const cdToken = await sessionService.sessData.cdToken;

//       const request: ICdRequest = {
//         ...selectedItem.cdRequest,
//         dat: {
//           ...selectedItem.cdRequest.dat,
//           token: cdToken,
//         },
//         args: {
//           name,
//           type,
//           ...(options.method && { method: options.method }),
//         },
//       };

//       const b = new BaseService();
//       const response = await b.invokeCdRequest(request);

//       if (response?.state) {
//         console.log(
//           chalk.green(
//             `✔ ${selectedItem.label} "${name}" ${DevModeAction[action].toLowerCase()}d successfully.`,
//           ),
//         );
//       } else {
//         console.log(
//           chalk.red(
//             `❌ Failed to ${DevModeAction[action].toLowerCase()} ${selectedItem.label}: ${response.message}`,
//           ),
//         );
//       }
//     } catch (err: any) {
//       console.error(
//         chalk.red(`❌ Error during ${DevModeAction[action].toLowerCase()}: ${err.message}`),
//       );
//     }
//   }

//   async getRegistryByAction(
//     action: DevModeAction,
//     moduleType: AppType,
//     moduleName: string,
//   ): Promise<CdFxReturn<IDevModeInstructionDescriptor[]>> {
//     return getRegistry(action, moduleName, moduleType);
//   }
// }

export class DevModeService {
  async getCreateRegistryForModule(
    moduleType: AppType | string,
    moduleName: string,
  ): Promise<CdFxReturn<IDevModeInstructionDescriptor[]>> {
    return this.getRegistryForModule(DevModeAction.CREATE, moduleType, moduleName);
  }

  async getRegistryForModule(
    action: DevModeAction,
    moduleType: AppType | string,
    moduleName: string,
  ): Promise<CdFxReturn<IDevModeInstructionDescriptor[]>> {
    const modTypeStr =
      typeof moduleType === 'string'
        ? moduleType
        : (moduleType as AppType).toString().toLowerCase();
    const filePath = `../../../app/mod-craft/workshop/${modTypeStr}/workflow/${moduleName}-workshop.model.js`;

    try {
      const module = await import(filePath);
      if (!module.getItemRegistry) {
        return {
          state: false,
          data: null,
          message: `❌ Missing getItemRegistry export in ${filePath}`,
        };
      }

      const result: CdFxReturn<IDevModeInstructionDescriptor[]> = module.getItemRegistry(
        action,
        moduleName,
        moduleType,
      );

      if (!result?.state) {
        return {
          state: false,
          data: null,
          message: result.message || '❌ Failed to generate registry instructions.',
        };
      }

      return result;
    } catch (err: any) {
      return {
        state: false,
        data: null,
        message: `❌ Failed to load registry for module "${moduleName}" of type "${moduleType}": ${err.message}`,
      };
    }
  }

  // async executeCrudCommand(action: DevModeAction, options: any): Promise<void> {
  //   const { name, type } = options;

  //   if (!name || !type) {
  //     console.log(chalk.red('❌ Missing --name or --type.'));
  //     return;
  //   }

  //   let registryResult: CdFxReturn<IDevModeInstructionDescriptor[]>;
  //   try {
  //     registryResult = await this.getRegistryForModule(action, type, name);
  //   } catch (err: any) {
  //     console.log(chalk.red(`❌ ${err.message}`));
  //     return;
  //   }

  //   if (!registryResult.state || !registryResult.data) {
  //     console.log(chalk.red(`❌ ${registryResult.message}`));
  //     return;
  //   }

  //   const registry = registryResult.data;
  //   const selectedItem = registry.find((item) => options[item.flag]);

  //   if (!selectedItem) {
  //     console.log(chalk.red(`❌ Invalid item to ${DevModeAction[action].toLowerCase()}.`));
  //     return;
  //   }

  //   const missing = selectedItem.requiredOptions.filter((key) => !options[key]);
  //   if (missing.length > 0) {
  //     console.log(chalk.red(`❌ Missing required options: ${missing.join(', ')}`));
  //     return;
  //   }

  //   try {
  //     const sessionService = new SessionService();
  //     const cdToken = await sessionService.sessData.cdToken;

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

  //     const b = new BaseService();
  //     const response = await b.invokeCdRequest(request);

  //     if (response?.state) {
  //       console.log(
  //         chalk.green(
  //           `✔ ${selectedItem.label} "${name}" ${DevModeAction[action].toLowerCase()}d successfully.`,
  //         ),
  //       );
  //     } else {
  //       console.log(
  //         chalk.red(
  //           `❌ Failed to ${DevModeAction[action].toLowerCase()} ${selectedItem.label}: ${response.message}`,
  //         ),
  //       );
  //     }
  //   } catch (err: any) {
  //     console.error(
  //       chalk.red(`❌ Error during ${DevModeAction[action].toLowerCase()}: ${err.message}`),
  //     );
  //   }
  // }

  async executeCrudCommand(
  action: DevModeAction,
  options: any,
): Promise<CdFxReturn<null>> {
  const { name, type } = options;

  if (!name || !type) {
    return {
      state: false,
      data: null,
      message: '❌ Missing --name or --type.',
    };
  }

  let registryResult: CdFxReturn<IDevModeInstructionDescriptor[]>;
  try {
    registryResult = await this.getRegistryForModule(action, type, name);
  } catch (err: any) {
    return {
      state: false,
      data: null,
      message: `❌ ${err.message}`,
    };
  }

  if (!registryResult.state || !registryResult.data) {
    return {
      state: false,
      data: null,
      message: registryResult.message || '❌ Invalid registry.',
    };
  }

  const registry = registryResult.data;
  const selectedItem = registry.find((item) => options[item.flag]);
  if (!selectedItem) {
    return {
      state: false,
      data: null,
      message: `❌ Invalid item to ${DevModeAction[action].toLowerCase()}.`,
    };
  }

  const missing = selectedItem.requiredOptions.filter((key) => !options[key]);
  if (missing.length > 0) {
    return {
      state: false,
      data: null,
      message: `❌ Missing required options: ${missing.join(', ')}`,
    };
  }

  try {
    const sessionService = new SessionService();
    const cdToken = await sessionService.sessData.cdToken;

    const request: ICdRequest = {
      ...selectedItem.cdRequest,
      dat: {
        ...selectedItem.cdRequest.dat,
        token: cdToken,
      },
      args: {
        name,
        type,
        ...(options.method && { method: options.method }),
      },
    };

    const b = new BaseService();
    const response = await b.invokeCdRequest(request);

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
    return {
      state: false,
      data: null,
      message: `❌ Error during ${DevModeAction[action].toLowerCase()}: ${err.message}`,
    };
  }
}

  async getRegistryByAction(
    action: DevModeAction,
    moduleType: AppType,
    moduleName: string,
  ): Promise<CdFxReturn<IDevModeInstructionDescriptor[]>> {
    return getRegistry(action, moduleName, moduleType);
  }
}
