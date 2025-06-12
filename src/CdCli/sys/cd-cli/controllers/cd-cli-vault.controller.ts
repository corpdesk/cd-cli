/* eslint-disable style/indent */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable antfu/if-newline */
/* eslint-disable style/operator-linebreak */
/* eslint-disable style/brace-style */
/* eslint-disable node/prefer-global/buffer */
/* eslint-disable node/prefer-global/process */

import type { ProfileModel } from '../models/cd-cli-profile.model.js';
import type { CdVaultItem, EncryptionMeta } from '../models/cd-cli-vault.model.js';
import crypto from 'node:crypto';
import fs, { existsSync, mkdirSync } from 'node:fs';
import path, { join } from 'node:path';
// import { loadCdCliConfig } from '../../../../config';
import axios from 'axios';
import inquirer from 'inquirer';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import {
  ENCRYPTION_CONFIGS,
  VAULT_DIRECTORY,
} from '../models/cd-cli-vault.model.js';
import { CdCliProfileController } from './cd-cli-profile.cointroller.js';

// Ensure the vault directory exists
if (!existsSync(VAULT_DIRECTORY)) {
  mkdirSync(VAULT_DIRECTORY, { recursive: true });
}

class CdCliVaultController {
  // ctlCdCliProfile: CdCliProfileController;
  constructor() {
    // ctlCdCliProfile = new CdCliProfileController();
  }

  static async getEncryptionKey(): Promise<Buffer> {
    // const inquirer: any = await import('inquirer');
    let encryptionKey = process.env.CD_CLI_ENCRYPT_KEY;

    if (!encryptionKey) {
      CdLog.warning('Encryption key not found in environment variables.');

      // Prompt user for action
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'provideKey',
          message:
            'Encryption key not found. Do you want to provide an existing key?',
          default: true,
        },
      ]);

      if (answers.provideKey) {
        // Prompt for existing encryption key
        const keyInput = await inquirer.prompt([
          {
            type: 'password',
            name: 'encryptionKey',
            message: 'Enter your existing encryption key:',
            mask: '*',
            validate: (input) =>
              input.length === 64 || 'Key must be a 64-character hex string.',
          },
        ]);
        encryptionKey = keyInput.encryptionKey;

        // Set the environment variable for subsequent use
        process.env.CD_CLI_ENCRYPT_KEY = encryptionKey;
      } else {
        // Ask if the user wants to generate a new key
        const generateNewKey = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'generateKey',
            message:
              'Do you want to generate a new encryption key? (This will make previous data inaccessible)',
            default: false,
          },
        ]);

        if (generateNewKey.generateKey) {
          encryptionKey = this.createEncryptionKey();
        } else {
          throw new Error('Operation aborted: No encryption key provided.');
        }
      }
    }

    // Validate the key length
    if (encryptionKey?.length !== 64) {
      throw new Error(
        `Invalid encryption key length: ${encryptionKey?.length}. Expected a 64-character hex string.`,
      );
    }

    return Buffer.from(encryptionKey, 'hex');
  }

  /**
   * Creates a new encryption key and saves it using `saveEncryptionKey`.
   * @returns {string} - The newly generated encryption key.
   */
  static createEncryptionKey(): string {
    const newKey = crypto.randomBytes(32).toString('hex');
    this.saveEncryptionKey(newKey);
    CdLog.success('New encryption key created and saved.');
    return newKey;
  }

  /**
   * Saves the encryption key to a secure location.
   * Current implementation saves to the `.env` file.
   * Future implementations may include Web3 and cloud-based options.
   * @param {string} encryptionKey - The encryption key to save.
   */
  static saveEncryptionKey(encryptionKey: string): void {
    const envFilePath = join(VAULT_DIRECTORY, '.env');

    // Ensure the .env file exists or create it
    if (!existsSync(envFilePath)) {
      CdLog.info('Creating .env file for storing the encryption key...');
      fs.writeFileSync(envFilePath, '');
    }

    // Append or update the encryption key in the .env file
    const envFileContent = fs.readFileSync(envFilePath, 'utf-8');
    const updatedContent = envFileContent.includes('CD_CLI_ENCRYPT_KEY=')
      ? envFileContent.replace(
          /CD_CLI_ENCRYPT_KEY=.*/,
          `CD_CLI_ENCRYPT_KEY=${encryptionKey}`,
        )
      : `${envFileContent}\nCD_CLI_ENCRYPT_KEY=${encryptionKey}`.trim();

    fs.writeFileSync(envFilePath, updatedContent, 'utf-8');
    CdLog.success('Encryption key saved to .env file.');
  }

  /**
   * Example usage of getEncryptionKey().
   */
  static exampleUsage(): void {
    try {
      const encryptionKeyBuffer = this.getEncryptionKey();
      console.log('Encryption Key Buffer:', encryptionKeyBuffer);
    } catch (error) {
      CdLog.error(`Error fetching encryption key: ${(error as Error).message}`);
    }
  }

  // export default CdCliVaultController;

  static getEncryptionMetaByName(name: string): EncryptionMeta {
    const config = ENCRYPTION_CONFIGS.find((config) => config.name === name);
    if (!config) {
      throw new Error(`Encryption configuration '${name}' not found.`);
    }
    return config;
  }

  static async encrypt(
    text: string,
    metaName: string,
  ): Promise<CdVaultItem | null> {
    CdLog.debug('starting CdCliVaultController::encrypt()');
    try {
      const meta = this.getEncryptionMetaByName(metaName);
      CdLog.debug('CdCliVaultController::encrypt()/meta:', meta);
      const iv = crypto.randomBytes(meta.ivLength);
      CdLog.debug('CdCliVaultController::encrypt()/iv:', iv);
      const cipher = crypto.createCipheriv(
        meta.algorithm,
        await this.getEncryptionKey(),
        iv,
      );

      let encrypted = cipher.update(
        text,
        'utf8',
        meta.encoding as BufferEncoding,
      );
      encrypted += cipher.final(meta.encoding as BufferEncoding);

      return {
        name: 'encrypted-data',
        description: 'Encrypted data',
        value: null, // Clear plain value after encryption
        encryptedValue: encrypted,
        isEncrypted: true,
        encryptionMeta: {
          ...meta,
          iv: iv.toString(meta.encoding),
          encryptedAt: new Date().toISOString(),
        } as EncryptionMeta & { iv: string; encryptedAt: string },
      };
    } catch (e: any) {
      CdLog.error(`Could not complete encryption: ${(e as Error).message}`);
      return null;
    }
  }

  /**
   * Usage:
   * Below is an example of encrypting from a value hosted in CdVault object.
   * This facility is not designed for production enviornment by special cases during development.
   *
   * let vaultEntry: CdVault = {
      name: 'gitHubToken',
      description: 'GitHub access token',
      value: 'plain-text-token',
      encryptedValue: null,
      isEncrypted: false,
      encryptionMeta: {} as EncryptionMeta, // Will be populated after encryption
    };

    // Encrypt the plain text
    vaultEntry = CdCliVaultController.encryptValue(vaultEntry);
    console.log('Encrypted Vault Entry:', vaultEntry);
   * @param vault
   * @param metaName
   * @returns
   */
  static async encryptValue(
    vault: CdVaultItem,
    metaName = 'default',
  ): Promise<CdVaultItem | null> {
    CdLog.debug('starting CdCliVaultController::encryptValue()');
    CdLog.debug('CdCliVaultController::encryptValue()/vault:', vault);
    CdLog.debug('CdCliVaultController::encryptValue()/metaName:', {
      mn: metaName,
    });
    if (vault.isEncrypted || !vault.value) {
      throw new Error(
        `Vault entry '${vault.name}' is already encrypted or has no plain value.`,
      );
    }

    const encryptedVault = await this.encrypt(vault.value, metaName);
    CdLog.debug('CdCliVaultController::encryptValue()/encryptedVault:', {
      encryptV: encryptedVault,
    });

    if (encryptedVault) {
      return {
        ...vault,
        value: null, // Clear plain text value after encryption
        encryptedValue: encryptedVault.encryptedValue,
        isEncrypted: true,
        encryptionMeta: encryptedVault.encryptionMeta,
      };
    } else {
      return null;
    }
  }

  static async decrypt(
    encryptionMeta: EncryptionMeta & { iv: string },
    encryptedValue: string,
  ): Promise<string | null> {
    CdLog.debug('starting CdCliValutController::decrypt()');
    CdLog.debug(
      'CdCliValutController::decrypt()/encryptionMeta:',
      encryptionMeta,
    );
    CdLog.debug('CdCliValutController::decrypt()/encryptedValue:', {
      e: encryptedValue,
    });

    try {
      if (!encryptionMeta.iv) {
        throw new Error(
          'Initialization vector (iv) is missing in the encryption metadata.',
        );
      }

      const iv = Buffer.from(encryptionMeta.iv, encryptionMeta.encoding);
      CdLog.debug('CdCliValutController::decrypt()/iv:', { vector: iv });

      const encryptionKey = await this.getEncryptionKey();
      const decipher = crypto.createDecipheriv(
        encryptionMeta.algorithm,
        encryptionKey,
        iv,
      );
      CdLog.debug('CdCliValutController::decrypt()/decipher:', decipher);

      let decrypted = decipher.update(
        encryptedValue,
        encryptionMeta.encoding as BufferEncoding,
        'utf8',
      );
      decrypted += decipher.final('utf8');
      CdLog.debug('CdCliValutController::decrypt()/07');

      return await decrypted;
    } catch (e: any) {
      CdLog.error('Error at CdCliValutController::decrypt()/e:', {
        e: (e as Error).message,
      });
      return await null;
    }
  }

  static async decryptValue(secret: CdVaultItem): Promise<string | null> {
    try {
      if (!secret.encryptionMeta) {
        console.error(`Missing encryption metadata for ${secret.name}`);
        return null;
      }

      if (!secret.encryptedValue) {
        console.error(`No encrypted value found for ${secret.name}`);
        return null;
      }

      const encryptionKey = await this.getEncryptionKey();
      const { iv, encoding, algorithm } = secret.encryptionMeta;

      if (!iv) {
        console.error(`Missing IV for ${secret.name}`);
        return null;
      }

      const ivBuffer = Buffer.from(iv, encoding);
      const encryptedValueBuffer = Buffer.from(secret.encryptedValue, encoding);

      const decipher = crypto.createDecipheriv(
        algorithm,
        encryptionKey,
        ivBuffer,
      );
      let decrypted = decipher.update(encryptedValueBuffer);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString();
    } catch (error) {
      console.error(`Decryption failed for ${secret.name}:`, error);
      return null;
    }
  }

  static storeSensitiveData(
    filePath: string,
    data: string,
    metaName = 'default',
  ): void {
    const vault = this.encrypt(data, metaName);
    fs.writeFileSync(filePath, JSON.stringify(vault, null, 2));
  }

  /**
   * Usage:
   * Retrieve encrypted data:
   * const decryptedValue = CdCliVaultController.getSensitiveData(vaultEntry);
     console.log('Decrypted Value:', decryptedValue);

   * @param vault
   * @returns
   */
  static async getSensitiveData(vault: CdVaultItem): Promise<string | null> {
    if (!vault.isEncrypted) {
      if (vault.value) return vault.value;
      throw new Error(`Vault entry '${vault.name}' is not encrypted.`);
    }

    if (!vault.encryptedValue || !vault.encryptionMeta) {
      throw new Error(
        `Vault entry '${vault.name}' is missing required encryption data.`,
      );
    }

    const encryptionMeta = vault.encryptionMeta;

    if (!encryptionMeta.iv) {
      throw new Error(
        `Vault entry '${vault.name}' is missing the 'iv' property in its encryption metadata.`,
      );
    }

    return await this.decrypt(
      { ...encryptionMeta, iv: encryptionMeta.iv } as EncryptionMeta & {
        iv: string;
      },
      vault.encryptedValue,
    );
  }

  public static saveProfileData(profileData: any): void {
    if (profileData.github?.token) {
      profileData.github.token = this.encrypt(
        profileData.github.token,
        'default',
      );
    }
    const configFilePath = join(VAULT_DIRECTORY, 'cd-cli.profiles.json');
    fs.writeFileSync(configFilePath, JSON.stringify(profileData, null, 2));
  }

  public static readProfileData(): any {
    const configFilePath = join(VAULT_DIRECTORY, 'cd-cli.profiles.json');
    const profileData = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));

    if (
      profileData.github?.token?.encryptedValue &&
      profileData.github?.token?.encryptionMeta
    ) {
      const { encryptedValue, encryptionMeta } = profileData.github.token;

      // Pass both encryptionMeta and encryptedValue to decrypt
      profileData.github.token = this.decrypt(encryptionMeta, encryptedValue);
    }

    return profileData;
  }

  public static async fetchAndSaveProfiles(cdToken: string): Promise<void> {
    if (!cdToken) {
      CdLog.error('No valid cdToken found. Cannot fetch profiles.');
      return;
    }

    const q = { where: { userId: -1 } };

    try {
      const response = await axios.post('API_ENDPOINT', q, {
        headers: { Authorization: `Bearer ${cdToken}` },
      });

      if (response.data.success) {
        const profiles = response.data.profiles || { items: [], count: 0 };
        const profilesPath = join(VAULT_DIRECTORY, 'profile.json');
        this.storeSensitiveData(profilesPath, JSON.stringify(profiles));
        CdLog.success('Profiles saved successfully.');
      } else {
        CdLog.error(`Failed to fetch profiles: ${response.data.message}`);
      }
    } catch (error) {
      CdLog.error('Error fetching profiles:', {
        error: (error as Error).message,
      });
    }
  }

  async encryptionKeyWizard(): Promise<void> {
    const encryptionKey = process.env.CD_CLI_ENCRYPT_KEY;
    if (!encryptionKey) {
      console.log('Encryption key not found. Generating a new key...');
      const newKey = crypto.randomBytes(32).toString('hex');
      process.env.CD_CLI_ENCRYPT_KEY = newKey;
      console.log('New encryption key generated.');
    } else {
      console.log('Encryption key exists. Validating...');
      // Add validation logic here.
    }

    // Add backup logic
    console.log('Checking backup configurations...');
    // Report backup status and suggestions.
  }

  async encryptionValidator(
    profileName: string | null = null,
    jPath: string | null = null,
  ): Promise<any> {
    const ctlCdCliProfile = new CdCliProfileController();
    const profileRet = await ctlCdCliProfile.loadProfiles();
    if (!profileRet.state || !profileRet.data) {
      CdLog.error(`Failed to load profiles: ${profileRet.message}`);
      return null; // Handle the failure case properly
    }

    // const cdCliConfig = ctlCdCliProfile.loadProfiles();
    const cdCliConfig = profileRet.data;

    if (!profileName && !jPath) {
      console.log('Validating all profiles...');
      for (const profile of cdCliConfig.items) {
        await this.validateCdVaultEntries(profile);
      }
    } else if (profileName) {
      const profile = cdCliConfig.items.find(
        (p) => p.cdCliProfileName === profileName,
      );
      if (!profile) {
        console.error(`Profile '${profileName}' not found.`);
        return;
      }
      await this.validateCdVaultEntries(profile);
    } else if (jPath) {
      console.log(`Validating field at path '${jPath}'...`);
      // Add logic to validate specific field.
    }
  }

  private async validateCdVaultEntries(profile: ProfileModel): Promise<void> {
    const { cdVault, details } = profile.cdCliProfileData || {};
    if (!cdVault) {
      console.log(
        `No cdVault entries for profile: ${profile.cdCliProfileName}`,
      );
      return;
    }

    for (const vaultItem of cdVault) {
      if (!vaultItem.isEncrypted) {
        console.log(`Encrypting and adding '${vaultItem.name}' to cdVault...`);
        // Encrypt and update vaultItem.
      } else {
        console.log(`Validating encrypted entry '${vaultItem.name}'...`);
        // Validate encryption metadata and re-encrypt if necessary.
      }
    }
  }

  static async resolveCdVaultReferences(
    cmds: string[],
    cdVault?: CdVaultItem[],
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

  static async resolveVaultReferencesInObject<T>(
    input: T,
    cdVault: CdVaultItem[] = [],
  ): Promise<T> {
    const isVaultRef = (val: unknown): val is string =>
      typeof val === 'string' && /#cdVault\['(.+?)'\]/.test(val);

    const recursiveResolve = async (obj: any): Promise<any> => {
      if (Array.isArray(obj)) {
        return Promise.all(obj.map(recursiveResolve));
      }

      if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
        for (const key of Object.keys(obj)) {
          result[key] = await recursiveResolve(obj[key]);
        }
        return result;
      }

      if (isVaultRef(obj)) {
        const key = obj.match(/#cdVault\['(.+?)'\]/)?.[1];
        const vaultEntry = cdVault.find((v) => v.name === key);
        if (vaultEntry) {
          return vaultEntry.isEncrypted
            ? await this.decryptValue(vaultEntry)
            : vaultEntry.value;
        } else {
          console.warn(`Vault reference key '${key}' not found.`);
          return obj;
        }
      }

      return obj;
    };

    return recursiveResolve(input);
  }
}

export default CdCliVaultController;
