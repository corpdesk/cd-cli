/* eslint-disable style/operator-linebreak */
/* eslint-disable style/brace-style */
import type { CdFxReturn } from '../../base/i-base.js';
import type {
  OperatingSystemDescriptor,
  SshCredentials,
  WorkstationDescriptor,
} from '../models/workstations.model.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { CdObjModel } from '../../moduleman/models/cd-obj.model.js';
import { GenericService } from '../../base/generic-service.js';

export class WorkstationService extends GenericService<CdObjModel> {
  constructor() {
    super(CdObjModel);
  }
  async executeScript(
    sshCredentials: SshCredentials,
    script: string,
  ): Promise<CdFxReturn<string>> {
    CdLog.debug('executeScript()/sshCredentials:', sshCredentials);
    CdLog.debug(`executeScript()/script: ${script}`);

    try {
      // Simulate SSH execution (replace with actual SSH library logic)
      const output = `Simulated script execution output for ${sshCredentials.host}`;

      return {
        data: output,
        state: true,
        message: 'Script executed successfully',
      };
    } catch (error) {
      CdLog.error(`executeScript()/error:${error}`);
      return {
        data: null,
        state: false,
        message: `Failed to execute script: ${(error as Error).message}`,
      };
    }
  }

  async detectOs(
    sshCredentials: SshCredentials,
  ): Promise<CdFxReturn<OperatingSystemDescriptor>> {
    CdLog.debug('detectOs()/sshCredentials:', sshCredentials);

    try {
      // Simulate OS detection (replace with actual SSH logic)
      const os: OperatingSystemDescriptor = {
        name: 'Ubuntu',
        version: '22.04',
        architecture: 'x86_64',
        timezone: '',
        // allocatedResources: {
        //   cpuCores: 4, // Number of CPU cores
        //   memory: { units: 'GB', value: 32 }, // e.g., "32GB"
        //   storage: { units: 'TB', value: 1 }, // e.g., "1TB"
        // },
        // hostname: '',
        // ipAddresses: [],
        // isVirtualized: false,
      };

      return {
        data: os,
        state: true,
        message: 'OS detected successfully',
      };
    } catch (error) {
      CdLog.error(`detectOs()/error:${error}`);
      return {
        data: null,
        state: false,
        message: `Failed to detect OS: ${(error as Error).message}`,
      };
    }
  }

  // validateWorkstation(
  //   ws: WorkstationDescriptor,
  // ): CdFxReturn<WorkstationDescriptor> {
  //   if (ws.name === 'unknown') {
  //     return {
  //       data: null,
  //       state: false,
  //       message: 'This workstation is invalid',
  //     };
  //   } else {
  //     return {
  //       data: ws,
  //       state: true,
  //       message: 'This workstation is valid',
  //     };
  //   }
  // }
  validateWorkstation(workstation: WorkstationDescriptor): boolean {
    if (!workstation || workstation.name === 'unknown') {
      return false;
    }

    if (
      !workstation.machineType ||
      !['physical', 'virtual', 'container'].includes(
        workstation.machineType.name,
      )
    ) {
      return false;
    }

    if (
      !workstation.os ||
      workstation.os.name === 'unknown' ||
      workstation.os.version === 'unknown'
    ) {
      return false;
    }

    if (
      !workstation.workstationAccess ||
      !workstation.workstationAccess.accessScope ||
      !workstation.workstationAccess.physicalAccess ||
      !workstation.workstationAccess.interactionType
    ) {
      return false;
    }

    return true; // Workstation is valid if all checks pass
  }
}
