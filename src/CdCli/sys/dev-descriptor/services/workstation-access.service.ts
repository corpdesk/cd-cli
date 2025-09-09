/* eslint-disable style/brace-style */
import type {
  TransportCredentials,
  WorkstationAccessDescriptor,
} from '../models/workstations.model.js';
/* eslint-disable ts/no-require-imports */
/* eslint-disable style/operator-linebreak */
import type { CdFxReturn } from '../../base/i-base.js';
import { SshService } from './ssh.service.js';
import { CdObjModel } from '../../moduleman/models/cd-obj.model.js';
import { GenericService } from '../../base/generic-service.js';

export class WorkstationAccessService extends GenericService<CdObjModel> {
  svSsh: SshService;
  constructor() {
    super(CdObjModel);
    this.svSsh = new SshService();
  }

  async executeRemoteCommand(
    workstationAccess: WorkstationAccessDescriptor,
    command: string,
  ): Promise<CdFxReturn<string>> {
    try {
      this.validateWorkstationAccess(workstationAccess);

      const { transport } = workstationAccess;
      if (
        transport?.protocol !== 'ssh' ||
        !transport.credentials?.sshCredentials
      ) {
        return {
          data: null,
          state: false,
          message:
            'SSH protocol and SSH credentials are required for remote access.',
        };
      }

      const { sshCredentials } = transport.credentials;
      const sshConfig = {
        host: sshCredentials.host,
        port: sshCredentials.port || 22, // Default SSH port
        username: sshCredentials.username,
        privateKey: sshCredentials.privateKey || undefined,
        password: sshCredentials.password || undefined,
      };

      const output = await this.svSsh.executeCommand(sshConfig, command);

      return {
        data: output,
        state: true,
        message: 'Command executed successfully.',
      };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Command execution failed: ${(error as Error).message}`,
      };
    }
  }

  async validateWorkstationAccess(
    workstationAccess: WorkstationAccessDescriptor,
  ): Promise<CdFxReturn<null>> {
    if (!workstationAccess.accessScope) {
      return {
        data: null,
        state: false,
        message: 'Access scope is required (local, remote, or hybrid).',
      };
    }

    if (!workstationAccess.physicalAccess) {
      return {
        data: null,
        state: false,
        message: 'Physical access type (direct, vpn, or tunnel) is required.',
      };
    }

    if (workstationAccess.physicalAccess !== 'direct') {
      if (
        !workstationAccess.transport ||
        !workstationAccess.transport.protocol
      ) {
        return {
          data: null,
          state: false,
          message: 'Transport protocol is required for VPN or tunnel access.',
        };
      }

      const { protocol, credentials } = workstationAccess.transport;
      const credentialsValid = this.validateTransportCredentials(
        protocol,
        credentials,
      );

      if (!credentialsValid.state) {
        return credentialsValid;
      }
    }

    if (!workstationAccess.interactionType) {
      return {
        data: null,
        state: false,
        message: 'Interaction type (cli, gui, api, or desktop) is required.',
      };
    }

    return {
      data: null,
      state: true,
      message: 'Workstation access validation successful.',
    };
  }

  async execute(command: string): Promise<CdFxReturn<null>> {
    try {
      const result = await this.runCommand(command);

      if (result.error) {
        return {
          data: null,
          state: false,
          message: `Execution failed: ${result.error}`,
        };
      }

      return {
        data: null,
        state: true,
        message: `Command executed successfully.`,
      };
    } catch (error) {
      return {
        data: null,
        state: false,
        message: `Execution error: ${(error as Error).message}`,
      };
    }
  }

  private async runCommand(command: string): Promise<{ error?: string }> {
    // Implement OS-specific command execution logic
    return new Promise(async (resolve) => {
      const { exec } = await import('node:child_process');
      exec(command, (error: any) => {
        if (error) {
          resolve({ error: error.message });
        } else {
          resolve({});
        }
      });
    });
  }

  validateTransportCredentials(
    protocol: string,
    credentials?: TransportCredentials,
  ): CdFxReturn<null> {
    if (!credentials) {
      return {
        data: null,
        state: false,
        message: `Credentials are required for transport protocol: ${protocol}.`,
      };
    }

    switch (protocol) {
      case 'ssh':
        if (
          !credentials.sshCredentials?.username ||
          !credentials.sshCredentials?.privateKey
        ) {
          return {
            data: null,
            state: false,
            message: 'SSH credentials must include username and private key.',
          };
        }
        break;
      case 'http':
        if (
          !credentials.httpCredentials?.token &&
          !(
            credentials.httpCredentials?.username &&
            credentials.httpCredentials?.password
          )
        ) {
          return {
            data: null,
            state: false,
            message:
              'HTTP credentials require a token or username/password (basic auth).',
          };
        }
        break;
      case 'rdp':
        if (
          !credentials.rdpCredentials?.username ||
          !credentials.rdpCredentials?.password
        ) {
          return {
            data: null,
            state: false,
            message: 'RDP credentials must include username and password.',
          };
        }
        break;
      case 'grpc':
        if (!credentials.grpcCredentials?.token) {
          return {
            data: null,
            state: false,
            message: 'gRPC credentials require a token.',
          };
        }
        break;
      default:
        if (!credentials.otherCredentials) {
          return {
            data: null,
            state: false,
            message: `Credentials are required for protocol: ${protocol}.`,
          };
        }
    }

    return {
      data: null,
      state: true,
      message: 'Transport credentials validation successful.',
    };
  }
}
