/* eslint-disable style/operator-linebreak */
/* eslint-disable style/brace-style */
import { NodeSSH } from 'node-ssh';
import { CdObjModel } from '../../moduleman/models/cd-obj.model.js';
import { GenericService } from '../../base/generic-service.js';

export class SshService extends GenericService<CdObjModel> {
  private ssh = new NodeSSH();

  constructor() {
    super(CdObjModel);
  }
  /**
   * Establishes an SSH connection and executes a command.
   */
  async executeCommand(
    config: {
      host: string;
      username: string;
      privateKey?: string;
      password?: string;
    },
    command: string,
  ): Promise<string> {
    try {
      await this.ssh.connect({
        host: config.host,
        username: config.username,
        privateKey: config.privateKey,
        password: config.password,
      });

      const result = await this.ssh.execCommand(command);
      this.ssh.dispose();
      return result.stdout || result.stderr;
    } catch (error) {
      throw new Error(`SSH execution failed: ${(error as Error).message}`);
    }
  }

  requiresSSH(
    accessScope: string,
    physicalAccess: string,
    transport?: { protocol: string },
  ): boolean {
    return (
      accessScope === 'remote' &&
      (physicalAccess !== 'direct' || transport?.protocol === 'ssh')
    );
  }
}
