import * as readline from 'readline';
import { exec } from 'child_process';
import { CdVault } from '../cd-cli/models/cd-cli-vault.model.js';
import CdCliVaultController from '../cd-cli/controllers/cd-cli-vault.controller.js';

export class CdCliUtils {
  async exec(cmds: string[], cdVault?: CdVault[]): Promise<void> {
    if (cdVault) {
      await this.handleEncryption(cdVault); // Handle password encryption if needed
    }

    const resolvedCmds = await this.resolveCdVaultReferences(cmds, cdVault);

    for (const cmd of resolvedCmds) {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
      });
    }
  }

  private async handleEncryption(cdVault: CdVault[]): Promise<void> {
    for (const secret of cdVault) {
      if (secret.isEncrypted && !secret.encryptedValue) {
        const password = await this.promptForPassword(secret.name);
        const encryptedData = await CdCliVaultController.encrypt(
          password,
          secret.encryptionMeta?.name || 'default',
        );

        if (encryptedData) {
          secret.encryptedValue = encryptedData.encryptedValue;
          secret.value = null; // Ensure plaintext is not stored
        }
      }
    }
  }

  private async promptForPassword(name: string): Promise<string> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
      });

      rl.question(`Enter password for ${name}: `, (password) => {
        rl.close();
        resolve(password);
      });
    });
  }

  private async resolveCdVaultReferences(
    cmds: string[],
    cdVault?: CdVault[],
  ): Promise<string[]> {
    if (!cdVault) return cmds;

    return Promise.all(
      cmds.map(async (cmd) => {
        // Find all matches of #cdVault['key']
        const matches = [...cmd.matchAll(/#cdVault\['(.+?)'\]/g)];

        if (matches.length === 0) {
          return cmd; // No replacements needed
        }

        let resolvedCmd = cmd;

        for (const match of matches) {
          const key = match[1]; // Extract the key inside #cdVault['key']
          const secret = cdVault.find((item) => item.name === key);

          if (secret && secret.encryptedValue) {
            const decryptedValue =
              await CdCliVaultController.decryptValue(secret);
            resolvedCmd = resolvedCmd.replace(
              match[0],
              decryptedValue ?? match[0],
            );
          } else {
            console.warn(`Warning: Missing cdVault entry for ${key}`);
          }
        }

        return resolvedCmd;
      }),
    );
  }
}
