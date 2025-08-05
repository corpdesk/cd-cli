// import { MOD_CRAFT_WORKSHOP_DIR } from '../../../app/app-craft/index.js';
import { CdFxReturn } from '../../base/index.js';
import {
  toCamelCase,
  toKebabCase,
  toPascalCase,
  toUniversalSnakeCase,
} from '../../utilities/cd-naming.util.js';
import {
  AppType,
  CdControllerDescriptor,
  CdCtx,
  CdModelDescriptor,
  CdModuleDescriptor,
  CdModuleTypeDescriptor,
  CdServiceDescriptor,
  deriveExemptConfig,
  envTestBed,
  envWorkshop,
  VersionControlDescriptor,
} from '../index.js';
import { basename, join, resolve } from 'path';
import { readFileSync } from 'fs';
// import { MOD_CRAFT_WORKFLOW_DIR } from '../../../app/app-craft/workshop/cd-api/workflow/default.model.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { inspect } from 'util';
import { pathToFileURL } from 'url';
import { VersionService } from './version.service.js';
import { getParentDirectory } from '../../utilities/fs.util.js';
import {
  MOD_CRAFT_WORKFLOW_MODULE_DIR,
  MOD_CRAFT_WORKSHOP_DIR,
} from '../../../app/app-craft/models/default.model.js';
import { DevModeAction } from '../../dev-mode/index.js';

export class CdModuleDescriptorService {
  // This service is responsible for managing module descriptors in the system.
  // It can include methods to create, update, delete, and retrieve module descriptors.

  // Example method to create a new module descriptor
  createModuleDescriptor(descriptor: any): void {
    // Implementation for creating a module descriptor
  }

  // Example method to update an existing module descriptor
  updateModuleDescriptor(id: string, descriptor: any): void {
    // Implementation for updating a module descriptor
  }

  // Example method to delete a module descriptor
  deleteModuleDescriptor(id: string): void {
    // Implementation for deleting a module descriptor
  }

  // Example method to retrieve a module descriptor by ID
  getModuleDescriptorById(id: string): any {
    // Implementation for retrieving a module descriptor by ID
    return {};
  }

  async deriveCdModuleDescriptor(basePath: string): Promise<CdFxReturn<CdModuleDescriptor>> {
    CdLog.debug(`CdModuleDescriptorService::deriveCdModuleDescriptor()/01`);
    const ctxDir = getParentDirectory(basePath);
    CdLog.debug(`CdModuleDescriptorService::deriveCdModuleDescriptor()/basePath:${basePath}`);
    CdLog.debug(`CdModuleDescriptorService::deriveCdModuleDescriptor()/ctxDir:${ctxDir}`);

    if (!ctxDir) {
      return {
        state: false,
        data: null,
        message: `Failed to derive context from base path: ${basePath}`,
      };
    }

    const ctxStr = basename(ctxDir); // e.g. 'sys' or 'app'
    CdLog.debug(`CdModuleDescriptorService::deriveCdModuleDescriptor()/ctxStr:${ctxStr}`);
    CdLog.debug(
      `CdModuleDescriptorService::deriveCdModuleDescriptor()/CdCtx:${inspect(CdCtx, { depth: null })}`,
    );

    let ctx: CdCtx;
    if (Object.values(CdCtx).includes(ctxStr as CdCtx)) {
      ctx = ctxStr as CdCtx;
    } else {
      throw new Error(`❌ Invalid context directory: '${ctxStr}' is not a valid CdCtx`);
    }

    const descriptor: CdModuleDescriptor = {
      name: path.basename(basePath),
      cdModuleType: { typeName: 'cd-api' },
      ctx,
      controllers: [],
      models: [],
      services: [],
    };

    // Prepare config
    const exempt = deriveExemptConfig[ctx] || [];
    const skip = (section: string) => exempt.includes(section);

    try {
      const dirs = {
        controllers: path.join(basePath, 'controllers'),
        services: path.join(basePath, 'services'),
        models: path.join(basePath, 'models'),
      };

      if (!skip('controllers') && (await fs.pathExists(dirs.controllers))) {
        const controllerFiles = await fs.readdir(dirs.controllers);
        for (const file of controllerFiles) {
          if (!file.endsWith('.ts')) continue;
          const name = file.replace(/\..*$/, '');
          descriptor.controllers.push({
            name,
            type: 'controller',
            fileName: file,
          } as CdControllerDescriptor);
        }
      }

      if (!skip('services') && (await fs.pathExists(dirs.services))) {
        const serviceFiles = await fs.readdir(dirs.services);
        for (const file of serviceFiles) {
          if (!file.endsWith('.ts')) continue;
          const name = file.replace(/\..*$/, '');
          descriptor.services.push({
            name,
            type: 'service',
            fileName: file,
          } as CdServiceDescriptor);
        }
      }

      if (!skip('models') && (await fs.pathExists(dirs.models))) {
        const modelFiles = await fs.readdir(dirs.models);
        for (const file of modelFiles) {
          if (!file.endsWith('.ts')) continue;
          const name = file.replace(/\..*$/, '');
          descriptor.models.push({
            name,
            fileName: file,
            fields: [],
          } as CdModelDescriptor);
        }
      }

      return {
        state: true,
        data: descriptor,
      };
    } catch (err: any) {
      return {
        state: false,
        data: null,
        message: `❌ Failed to derive module descriptor: ${err.message}`,
      };
    }
  }

  async getCtx(basePath): Promise<CdFxReturn<CdCtx>> {
    try {
      const ctxPath = join(basePath, 'ctx.json');
      const ctxData = readFileSync(ctxPath, 'utf-8');
      const ctx: CdCtx = JSON.parse(ctxData);
      return {
        state: true,
        data: ctx,
      };
    } catch (error: any) {
      return {
        state: false,
        data: null,
        message: `Failed to read context from ${basePath}: ${error.message}`,
      };
    }
  }

  defaultCdApiModuleData(customModuleData: CdModuleDescriptor): CdModuleDescriptor {
    const cdObjName = customModuleData.name;
    const modulePascal = toPascalCase(cdObjName);
    const cdObjTypeName = customModuleData.cdModuleType;
    const moduleCtx = customModuleData.ctx;

    const processedControllers = customModuleData.controllers.map((c, index) => {
      const controllerName = c.name;
      const controllerPascal = toPascalCase(controllerName);
      const controllerCamel = toCamelCase(controllerName);
      const controllerKebab = toKebabCase(controllerName);
      const controllerSnake = toUniversalSnakeCase(controllerName);

      const isMain = index === 0;

      // === CONTROLLER ===
      const controller = {
        type: 'controller',
        name: controllerName,
        classSignature: { extends: 'CdController' },
        attributes: [
          {
            name: 'b',
            type: 'BaseService',
            visibility: 'private',
            isDependency: true,
            isStateful: true,
          },
          {
            name: `sv${controllerPascal}`,
            type: `${controllerPascal}Service`,
            visibility: 'private',
            isDependency: true,
            isStateful: true,
          },
          {
            name: 'http',
            type: 'express',
            isApiEntry: true,
            httpContextAware: true,
            routing: {
              baseRoute: `/${controllerName.toLowerCase()}`,
              authRequired: true,
              methods: {
                Create: { httpMethod: 'POST', route: '/' },
                Get: { httpMethod: 'GET', route: '/' },
                GetType: { httpMethod: 'GET', route: '/type' },
                GetCount: { httpMethod: 'GET', route: '/count' },
                Update: { httpMethod: 'PUT', route: '/' },
                Delete: { httpMethod: 'DELETE', route: '/' },
              },
            },
          },
        ],
        methods: ['Create', 'Get', 'GetType', 'GetCount', 'Update', 'Delete'].map((methodName) => ({
          name: methodName,
          isDefault: methodName === 'Create',
          scope: { visibility: 'public', static: false },
          output: {
            returnType: 'Promise<void>',
            description: `${methodName} operation for ${controllerPascal}`,
          },
          parameters: [
            { name: 'req', type: 'Request' },
            { name: 'res', type: 'Response' },
          ],
          behavior: { isAsync: true, isPure: false, returnsPromise: true },
        })),
      };

      // === MODEL ===
      const model = {
        name: `${controllerPascal}`,
        parentController: controllerName,
        fileName: `${controllerKebab}.model.ts`,
        tableName: controllerSnake,
        fields: [
          {
            name: `${controllerCamel}Id`,
            type: 'number',
            required: true,
            default: true,
          },
          {
            name: `${controllerCamel}Guid`,
            type: 'string',
            required: true,
            default: true,
          },
          {
            name: `${controllerCamel}Name`,
            type: 'string',
            required: false,
            default: true,
          },
          {
            name: `${controllerCamel}Description`,
            type: 'string',
            required: true,
            default: true,
          },
          {
            name: `${controllerCamel}DocId`,
            type: 'number',
            required: false,
            default: true,
          },
          {
            name: `${controllerCamel}Enabled`,
            type: 'boolean',
            required: false,
            default: true,
          },
        ],
      };

      // === SERVICE ===
      const service = {
        type: 'service',
        name: controllerName,
        classSignature: {
          extends: 'CdService',
          implements: [],
        },
        attributes: [
          { name: 'logger', type: 'Logging', isDefault: true },
          { name: 'b', type: 'BaseService', isDefault: true },
          { name: 'cdToken', type: 'string', isDefault: true },
          { name: 'uid', type: 'number', isDefault: true },
          {
            name: 'serviceModel',
            type: `${controllerPascal}Model`,
            isDefault: true,
          },
          { name: 'svSess', type: 'SessionService', isDefault: true },
          { name: 'validationCreateParams', type: 'any', isDefault: true },
          {
            name: 'cRules',
            type: 'object',
            isDefault: true,
            defaultValue: {},
          },
        ],
        methods: [
          'create',
          'validateCreate',
          `${controllerCamel}Exists`,
          `get${controllerPascal}Count`,
          'update',
          'delete',
          `get${controllerPascal}Profile`,
          `get${controllerPascal}ProfileByToken`,
          `getScoped${controllerPascal}`,
          `update${controllerPascal}Profile`,
          `activate${modulePascal}`,
        ].map((methodName) => ({
          name: methodName,
          isDefault: methodName === 'create',
          scope: { visibility: 'public', static: false },
          output: {
            returnType: methodName.includes('Exists')
              ? `Promise<${controllerPascal}Model[]>`
              : 'Promise<void>',
            description: `Performs ${methodName}`,
          },
          behavior: { isAsync: true, isPure: false, returnsPromise: true },
          parameters: [
            'get',
            'update',
            'delete',
            'create',
            'validateCreate',
            'getScoped',
            'getProfile',
            'updateProfile',
            'getCount',
            'getByToken',
            'activate',
          ].some((m) => methodName.toLowerCase().includes(m))
            ? [
                { name: 'req', type: 'Request' },
                { name: 'res', type: 'Response' },
              ]
            : undefined,
        })),
      };

      return { controller, model, service };
    });

    const finalControllers = processedControllers.map((e) => e.controller);
    const finalModels = processedControllers.map((e) => e.model);
    const finalServices = processedControllers.map((e) => e.service);

    return {
      ...customModuleData,
      controllers: finalControllers as CdModuleDescriptor['controllers'],
      models: finalModels,
      services: finalServices as CdModuleDescriptor['services'],
    };
  }

  async cdApiModuleData(
    cdObjName: string,
    cdObjTypeName: string,
    extraParams?: any,
  ): Promise<CdFxReturn<CdModuleDescriptor>> {
    try {
      CdLog.debug('CdModuleDescritorService::cdApiModuleData()/01');

      // const pascalName = toPascalCase(cdObjName);

      // Build full path to the JSON descriptor
      // old verson
      // const workflowPath = join(MOD_CRAFT_WORKFLOW_MODULE_DIR, `${cdObjName}.create.module.json`);

      // new version
      // /home/emp-12/cd-cli/src/CdCli/app/app-craft/workshop/cd-module/workflow/cd-ai.create.module.json
      const workflowPath = `${MOD_CRAFT_WORKSHOP_DIR}/${extraParams.appType}/workflow/cd-ai.create.module.json`;

      

      // Read and parse custom module descriptor
      const fileContents = readFileSync(workflowPath, 'utf-8');
      const custom: CdModuleDescriptor = JSON.parse(fileContents);
      CdLog.debug('CdModuleDescritorService::cdApiModuleData()/02');

      // set version control for the module
      // custom.versionControl = cdAiVersionControl;
      const svVersion = new VersionService();
      const vcResult = await svVersion.getVersionControl(cdObjName, cdObjTypeName, extraParams.appType, extraParams.oEnv);
      if (!vcResult || !vcResult.state || !vcResult.data) {
        return {
          state: false,
          data: null,
          message: `Could not get a valid version controll for the module`,
        };
      }
      custom.versionControl = vcResult.data;
      CdLog.debug('CdModuleDescritorService::cdApiModuleData()/05');
      // Derive base descriptor from custom
      const base: CdModuleDescriptor = this.defaultCdApiModuleData(custom);

      CdLog.debug('CdModuleDescritorService::cdApiModuleData()/06');
      // Merge base and custom descriptors
      const merged: CdModuleDescriptor = {
        ...base,
        ...custom,
        controllers: [...(base.controllers || []), ...(custom.controllers || [])],
        services: [...(base.services || []), ...(custom.services || [])],
        models: [...(base.models || []), ...(custom.models || [])],
        // contributors: custom.contributors || base.contributors,
        description: custom.description || base.description,
      };
      CdLog.debug('CdModuleDescritorService::cdApiModuleData()/07');
      return {
        state: true,
        message: 'Descriptors merged successfully.',
        data: merged,
      };
    } catch (error: any) {
      return {
        state: false,
        message: `Failed to merge descriptors: ${error.message}`,
        data: null,
      };
    }
  }
}
