/* eslint-disable node/prefer-global/process */
import { join } from 'node:path';

export const VAULT_DIRECTORY = join(process.env.HOME || '~/', '.cd-cli');

// Interfaces
export interface CdVault {
  name: string; // Unique identifier for the vault entry
  description?: string; // Description of the vault entry
  value: string | null; // Value if not encrypted
  encryptedValue?: string | null; // Encrypted data
  isEncrypted: boolean; // Indicates if the data is encrypted
  encryptionMeta?: EncryptionMeta; // Metadata for the encryption
}

export interface EncryptionMeta {
  name?: string; // Identifier for the encryption configuration
  algorithm: string; // Encryption algorithm (e.g., 'aes-256-cbc')
  encoding: BufferEncoding; // Encoding format (e.g., 'hex', 'base64')
  ivLength: number; // Length of the initialization vector
  iv?: string; // Add 'iv' as an optional property
  keyDerivationMethod?: string; // Optional: Method used to derive the key
  keySalt?: string; // Optional: Salt used for key derivation
  additionalAuthenticatedData?: string; // Optional: For AEAD algorithms
  encryptedAt?: string; // Optional: Timestamp when encryption occurred
  encryptedToken?: string;
}

// Encryption configurations
export const ENCRYPTION_CONFIGS: EncryptionMeta[] = [
  {
    name: 'default',
    algorithm: 'aes-256-cbc',
    encoding: 'hex',
    ivLength: 16,
  },
  {
    name: 'optional-aes-gcm',
    algorithm: 'aes-256-gcm',
    encoding: 'base64',
    ivLength: 12,
    additionalAuthenticatedData: 'auth-data',
  },
];

// cd-cli-vault.model.ts

export const EncryptionKeyWizardPromptData = [
  {
    type: 'confirm',
    name: 'checkExistingKey',
    message:
      'Would you like to check the validity of the existing encryption key?',
    default: true,
  },
  {
    type: 'list',
    name: 'keyAction',
    message: 'Choose an action for the encryption key:',
    choices: [
      { name: 'Generate a new encryption key', value: 'generate' },
      { name: 'Validate the existing encryption key', value: 'validate' },
      { name: 'Skip (keep existing key)', value: 'skip' },
    ],
    when: (answers: any) => answers.checkExistingKey,
  },
  {
    type: 'confirm',
    name: 'backupKey',
    message: 'Would you like to back up the encryption key?',
    default: true,
  },
  {
    type: 'list',
    name: 'backupMethod',
    message: 'Select a backup method for the encryption key:',
    choices: [
      { name: 'Save to a secure file', value: 'file' },
      { name: 'Backup to blockchain (Web3)', value: 'web3' },
    ],
    when: (answers: any) => answers.backupKey,
  },
  {
    type: 'input',
    name: 'secureFilePath',
    message: 'Enter the file path to store the encryption key securely:',
    default: `${process.env.HOME || '~'}/.cd-cli/cd-cli.key`,
    when: (answers: any) => answers.backupMethod === 'file',
  },
];

export const EncryptionValidatorPromptData = [
  {
    type: 'confirm',
    name: 'validateAllProfiles',
    message: 'Do you want to validate encryption for all profiles?',
    default: false,
  },
  {
    type: 'input',
    name: 'profileName',
    message: 'Enter the profile name for validation:',
    when: (answers: any) => !answers.validateAllProfiles,
  },
  {
    type: 'input',
    name: 'jPath',
    message:
      'Enter the JSON path (e.g., "details.gitAccess.gitHubToken") for the field to validate:',
    when: (answers: any) => !answers.validateAllProfiles && answers.profileName,
  },
  {
    type: 'confirm',
    name: 'encryptField',
    message:
      'The selected field is not encrypted. Do you want to encrypt it now?',
    when: (answers: any) => answers.jPath,
    default: true,
  },
  {
    type: 'list',
    name: 'encryptionMeta',
    message: 'Choose the encryption configuration for this field:',
    choices: ENCRYPTION_CONFIGS.map((config) => ({
      name: `${config.name} (${config.algorithm})`,
      value: config,
    })),
    when: (answers: any) => answers.encryptField,
  },
];
