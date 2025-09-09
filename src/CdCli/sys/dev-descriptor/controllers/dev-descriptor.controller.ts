/* eslint-disable brace-style */
/* eslint-disable node/prefer-global/process */
import {
  CD_FX_FAIL,
  type CdFxReturn,
  type ICdResponse,
  type IQuery,
  type ISessResp,
} from '../../base/i-base.js';
import type {
  CdDescriptor,
  TypeDescriptor,
  TypeDetails,
} from '../models/dev-descriptor.model.js';
import { dirname, join } from 'node:path';
import fs from 'node:fs';
// import { fileURLToPath } from 'node:url';
import util from 'node:util';
/* eslint-disable style/brace-style */
/* eslint-disable style/operator-linebreak */
import chalk from 'chalk';
import Table from 'cli-table3';
import ts from 'typescript';
import { HttpService } from '../../base/http.service.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';

// import { CdObjService } from '../../moduleman/services/dev-descriptor.service';
import { SessonController } from '../../user/controllers/session.controller.js';
import { DevDescriptorService } from '../services/dev-descriptor.service.js';
import { CdObjTypeModel } from '../../moduleman/models/cd-obj-type.model.js';
import { CdCliStoreService } from '../../cd-cli/services/cd-cli-store.service.js';
import { CdObjService } from '../../moduleman/services/cd-obj.service.js';
import { CdObjModel } from '../../moduleman/index.js';
import { fileURLToPath } from 'node:url';

// let chalk: any;

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DevDescriptorController {
  svServer = new HttpService();
  svDevDescriptor = new DevDescriptorService();
  ctlSession = new SessonController();

  isDev = false;
  modelsDir = '';
  savedDescriptors: CdObjModel[] = [];
  constructor() {
    this.isDev = process.env.NODE_ENV === 'development';
    this.modelsDir = join(__dirname, '../src/CdCli/sys/dev-descriptor/models');
  }

  async getSrcDescriptors(): Promise<CdFxReturn<CdObjModel[]>> {
    CdLog.debug('DevDescriptorController::getSrcDescriptors()/starting...');
    try {
      this.savedDescriptors = await this.fetchSavedDescriptors();
      CdLog.debug(
        `DevDescriptorController::getSrcDescriptors()/this.savedDescriptors.length:${this.savedDescriptors.length}`,
      );

      const srcDescriptors: CdObjModel[] = [];
      const files = fs
        .readdirSync(this.modelsDir)
        .filter((file) => file.endsWith('.ts'));

      for (const file of files) {
        const filePath = join(this.modelsDir, file);
        const sourceFile = ts.createSourceFile(
          file,
          fs.readFileSync(filePath, 'utf8'),
          ts.ScriptTarget.ESNext,
          true,
        );

        ts.forEachChild(sourceFile, (node) => {
          if (ts.isInterfaceDeclaration(node) || ts.isEnumDeclaration(node)) {
            const cdObjName = node.name.text;
            const cdObjId = this.getCdObjIdByName(
              cdObjName,
              this.savedDescriptors,
            );

            const jDetails: TypeDescriptor[] = this.extractTypeDetails(node);
            srcDescriptors.push({
              cdObjId,
              cdObjName,
              jDetails,
              cdObjTypeGuid: '',
            });
          }
        });
      }

      CdLog.debug(
        `DevDescriptorController::getSrcDescriptors()/srcDescriptors.length:${srcDescriptors.length}`,
      );
      return { data: srcDescriptors, state: true }; // Standardized return object
    } catch (e: any) {
      CdLog.error(
        `Encountered an error while compiling descriptors. Error: ${(e as Error).message}`,
      );
      return { data: null, state: false }; // On failure, return null
    }
  }

  private extractTypeDetails(
    node: ts.InterfaceDeclaration | ts.EnumDeclaration,
    // descriptors: CdDescriptor[],
  ): TypeDescriptor[] {
    const typeDescriptors: TypeDescriptor[] = [];

    if (ts.isInterfaceDeclaration(node)) {
      for (const member of node.members) {
        if (ts.isPropertySignature(member) && member.type) {
          const field = member.name.getText();
          const optional = !!member.questionToken;
          const typeDetails = this.mapTypeToDetails(member.type);
          const description = ''; // Placeholder, could be extracted from JSDoc comments

          typeDescriptors.push({ field, optional, typeDetails, description });
        }
      }
    }
    return typeDescriptors;
  }

  private mapTypeToDetails(typeNode: ts.TypeNode): TypeDetails {
    const typeDetails: TypeDetails = { cdObjId: -1 }; // Default value

    if (!typeNode) {
      return typeDetails; // Return default if typeNode is undefined
    }

    // Handle array types
    if (ts.isArrayTypeNode(typeNode)) {
      typeDetails.isArray = true;
      typeDetails.cdObjId = this.getCdObjId(typeNode.elementType);
    }
    // Handle union types (e.g., AppType | AppType[])
    else if (ts.isUnionTypeNode(typeNode)) {
      for (const subtype of typeNode.types) {
        if (ts.isArrayTypeNode(subtype)) {
          typeDetails.isArray = true;
          typeDetails.cdObjId = this.getCdObjId(subtype.elementType);
        } else {
          typeDetails.cdObjId = this.getCdObjId(subtype);
        }
      }
    }
    // Handle primitive types (number, string, boolean, etc.)
    else if (
      typeNode.kind >= ts.SyntaxKind.FirstKeyword &&
      typeNode.kind <= ts.SyntaxKind.LastKeyword
    ) {
      typeDetails.isPrimitive = true;
      typeDetails.cdObjId = this.getCdObjId(typeNode);
    }
    // Handle interface or descriptor types
    else if (ts.isTypeReferenceNode(typeNode)) {
      const typeName = typeNode.typeName.getText();
      const referencedDescriptor = this.savedDescriptors.find(
        (d) => d.cdObjName === typeName,
      );

      if (referencedDescriptor) {
        typeDetails.cdObjId = referencedDescriptor.cdObjId;
        typeDetails.isInterface = true;
        typeDetails.isDescriptor = true; // If it’s a descriptor type

        // Check if the referenced type extends another type
        const extendsCdObjId = this.getExtendedCdObjId(typeName);
        if (extendsCdObjId) {
          typeDetails.extend = extendsCdObjId;
        }
      }
    }

    return typeDetails;
  }

  private getCdObjId(typeNode: ts.TypeNode): number | undefined {
    const typeName = typeNode.getText();
    const descriptor = this.savedDescriptors.find(
      (d) => d.cdObjName === typeName,
    );
    return descriptor ? descriptor.cdObjId : -1;
  }

  private getExtendedCdObjId(typeName: string): number | undefined {
    const referencedDescriptor = this.savedDescriptors.find(
      (d) => d.cdObjName === typeName,
    );

    if (!referencedDescriptor) {
      return undefined;
    }

    const sourceFile = ts.createSourceFile(
      `${typeName}.ts`,
      fs.readFileSync(join(this.modelsDir, `${typeName}.ts`), 'utf8'),
      ts.ScriptTarget.ESNext,
      true,
    );

    let extendId: number | undefined;

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) {
        if (node.heritageClauses) {
          for (const clause of node.heritageClauses) {
            if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
              const extendedTypeName = clause.types[0].expression.getText();
              const extendedDescriptor = this.savedDescriptors.find(
                (d) => d.cdObjName === extendedTypeName,
              );

              if (extendedDescriptor) {
                extendId = extendedDescriptor.cdObjId;
              }
            }
          }
        }
      }
    });

    return extendId;
  }

  // generateObjectId
  getCdObjIdByName(
    name: string,
    descriptors: CdObjModel[],
  ): number | undefined {
    const found = descriptors.find((desc) => desc.cdObjName === name);
    return found ? found.cdObjId : -1;
  }

  async showSrcDescriptors(options?: {
    names?: string[]; // Updated to accept multiple names
    json?: boolean;
    pretty?: boolean;
  }) {
    let result: CdFxReturn<CdObjModel[]>;

    CdLog.debug(
      `DevDescriptorController::showSrcDescriptors()/options?.names:${options?.names}`,
    );
    CdLog.debug(
      `DevDescriptorController::showSrcDescriptors()/options.names.length:${options?.names?.length}`,
    );
    // Fetch descriptors based on whether names are provided
    if (options?.names && options.names.length > 0) {
      CdLog.debug(
        `DevDescriptorController::showSrcDescriptors()/selecting by names...`,
      );
      CdLog.debug(
        `DevDescriptorController::showSrcDescriptors()/options?.names:${options?.names}`,
      );
      result = await this.getDescriptorsByNames(options.names);
    } else {
      CdLog.debug(
        `DevDescriptorController::showSrcDescriptors()/getting all...`,
      );
      result = await this.getAllDescriptors();
    }

    // Handle errors
    if (!result.state) {
      console.error(result.message || 'Failed to fetch descriptors.');
      return;
    }

    if (!result.data || result.data.length === 0) {
      console.log('No descriptors found.');
      return;
    }

    const srcDescriptors: CdObjModel[] = result.data;
    CdLog.debug(
      `DevDescriptorController::showSrcDescriptors()/srcDescriptors:${srcDescriptors.length}`,
    );

    // Handle JSON output
    if (options?.json) {
      console.log(
        options.pretty
          ? JSON.stringify(srcDescriptors, null, 2) // Pretty JSON
          : JSON.stringify(srcDescriptors),
      ); // Compact JSON
      return;
    }

    // Default: Tabular output
    const table = new Table({
      head: [chalk.blue('ID'), chalk.blue('Name'), chalk.blue('GUID')],
      colWidths: [10, 30, 40],
    });

    srcDescriptors.forEach((desc) => {
      table.push([desc.cdObjId, desc.cdObjName, desc.cdObjGuid || 'N/A']);
    });

    console.log(table.toString());
  }

  async getDescriptorsByNames(
    names: string[],
  ): Promise<CdFxReturn<CdObjModel[]>> {
    const result = await this.getAllDescriptors();

    if (!result.state) {
      return {
        data: null,
        state: false,
        message: 'Failed to fetch descriptors.',
      };
    }

    const filteredDescriptors =
      result.data?.filter((desc) => names.includes(desc.cdObjName)) || [];

    return { data: filteredDescriptors, state: true };
  }

  async getAllDescriptors(): Promise<CdFxReturn<CdObjModel[]>> {
    const result = await this.getSrcDescriptors();

    if (!result.state) {
      return {
        data: null,
        state: false,
        message: 'Failed to retrieve source descriptors.',
      };
    }

    if (!result.data || result.data.length === 0) {
      return { data: null, state: false, message: 'No descriptors available.' };
    }

    const matchingDescriptors = result.data;

    if (matchingDescriptors.length === 0) {
      return {
        data: null,
        state: false,
        message: `No descriptor found`,
      };
    }

    return {
      data: matchingDescriptors,
      state: true,
      message: 'Descriptor(s) found successfully.',
    };
  }

  async fetchSavedDescriptors(): Promise<CdObjModel[]> {
    const q: IQuery = {
      select: ['cdObjId', 'cdObjName'],
      where: { cdObjTypeGuid: '5ab9a944-1014-4664-ad96-8ceb737d1857' },
    };
    const svCdObj = new CdObjService();
    const res = (await svCdObj.getCdObj(q)) as CdFxReturn<CdObjModel[]>;
    CdLog.debug(`DevDescriptorController::fetchSavedDescriptors()/res:${res}`);

    if (!res.state || !res.data) {
      CdLog.error(`There was an error syncing descriptors`);
      return [];
    }

    if (res.data && !res.state) {
      CdLog.error(`There was an error syncing descriptors:${res.message}`);
      return [];
    }

    const descriptors: CdObjModel[] = res.data;
    return descriptors;
  }

  async syncDescriptors(
    names?: string[],
    db?: 'mysql' | 'redis' | 'all',
  ): Promise<CdFxReturn<null>> {
    let ret: any = null;
    try {
      CdLog.debug(
        `DevDescriptorController::syncDescriptors()/starting... names: ${JSON.stringify(names)}`,
      );

      let result: CdFxReturn<CdObjModel[]>;

      // Fetch descriptors based on provided names
      if (names && names.length > 0) {
        result = await this.getDescriptorsByNames(names);
      } else {
        result = await this.getSrcDescriptors();
      }

      // Handle failure in fetching descriptors
      if (!result.state || !result.data) {
        const errorMsg =
          result.message || 'Unknown error fetching descriptors.';
        CdLog.error(`Failed to fetch descriptors: ${errorMsg}`);
        return { data: null, state: false, message: errorMsg };
      }

      CdLog.debug(
        `DevDescriptorController::syncDescriptors()/Fetched ${result.data.length} descriptors`,
      );

      // Sync descriptors
      const response = await this.svDevDescriptor.syncDescriptors(
        result.data,
        db,
      );

      CdLog.debug(
        'DevDescriptorController::syncDescriptors()/response:',
        response,
      );

      if (!response.state || !response.data) {
        CdLog.error('Error: Sync failed or response data is empty.');
        return CD_FX_FAIL;
      } else if (Array.isArray(response.data)) {
        // It's of type CdObjModel[]
        CdLog.debug('Sync returned invalid data:', response.data);
        return CD_FX_FAIL;
      } else if ('app_state' in response.data) {
        // It's of type ICdResponse (assuming app_state is unique to ICdResponse)
        CdLog.debug('Sync returned an ICdResponse object:', response.data);
        // Check sync success
        if (response.state && response.data?.app_state?.success) {
          CdLog.success('✔ Descriptors successfully synced.');
          ret = {
            data: null,
            state: true,
            message: 'Descriptors synced successfully.',
          };
        } else {
          const errorInfo = response.data?.app_state?.info || {
            error: 'Unknown sync error',
          };
          CdLog.error('Sync failed:', errorInfo);
          ret = {
            data: null,
            state: false,
            message: 'Sync failed. Please check and try again.',
          };
        }
      } else {
        CdLog.error('Unknown response type:', response.data);
        return CD_FX_FAIL;
      }
      return ret;
    } catch (error: any) {
      CdLog.error('Error during descriptor syncing:', error.message);
      return { data: null, state: false, message: `Error: ${error.message}` };
    }
  }

  async syncDescriptorData(
    name: string,
    type: string,
    db: 'mysql' | 'redis' | 'all',
  ): Promise<CdFxReturn<null>> {
    let ret: any = null;
    try {
      CdLog.debug(
        `DevDescriptorController::syncDescriptorData()/starting... name: ${name}, type: ${type}`,
      );

      // Fetch descriptor data based on name and type
      const result = await this.svDevDescriptor.getDescriptorDataByNameAndType(
        name,
        type,
      );

      if (!result.state || !result.data) {
        const errorMsg =
          result.message || 'Unknown error fetching descriptor data.';
        CdLog.error(`Failed to fetch descriptor data: ${errorMsg}`);
        return { data: null, state: false, message: errorMsg };
      }

      CdLog.debug(
        `DevDescriptorController::syncDescriptorData()/Fetched descriptor data for ${name}`,
      );

      // Sync descriptor data
      const response = await this.svDevDescriptor.syncDescriptorData(
        result.data,
        db,
      );

      CdLog.debug(
        'DevDescriptorController::syncDescriptorData()/response:',
        response,
      );

      if (!response.state || !response.data) {
        CdLog.error('Error: Sync failed or response data is empty.');
        return CD_FX_FAIL;
      } else if ('app_state' in response.data) {
        if (response.data.app_state.success) {
          CdLog.success('✔ Descriptor data successfully synced.');
          ret = {
            data: null,
            state: true,
            message: 'Descriptor data synced successfully.',
          };
        } else {
          const errorInfo = response.data.app_state.info || {
            error: 'Unknown sync error',
          };
          CdLog.error('Sync failed:', errorInfo);
          ret = {
            data: null,
            state: false,
            message: 'Sync failed. Please check and try again.',
          };
        }
      } else {
        CdLog.error('Unknown response type:', response.data);
        return CD_FX_FAIL;
      }
      return ret;
    } catch (error: any) {
      CdLog.error('Error during descriptor data syncing:', error.message);
      return { data: null, state: false, message: `Error: ${error.message}` };
    }
  }

  async syncApps(
    names: string[],
    db: 'mysql' | 'redis' | 'all',
  ): Promise<void> {
    CdLog.debug('names:', names);
  }

  async syncModules(
    names: string[],
    db: 'mysql' | 'redis' | 'all',
  ): Promise<void> {
    CdLog.debug('names:', names);
  }
}
