/* eslint-disable style/brace-style */
import crypto from 'node:crypto';
import fs, { existsSync, mkdirSync } from 'node:fs';
import path, { join } from 'node:path';
import { VAULT_DIRECTORY } from '../models/cd-cli-vault.model';
import CdCliVaultController from './cd-cli-vault.controller';

// jest.mock('path', () => ({
//   join: (...args: string[]) => args.join('/'),
// }));

describe('cdCliVaultController - Encryption Key Management', () => {
  const envFilePath = join(VAULT_DIRECTORY, '.env');
  let originalEnvKey: string | undefined;

  beforeAll(() => {
    // Backup original environment variable
    originalEnvKey = process.env.CD_CLI_ENCRYPT_KEY;

    // Ensure test directory exists
    if (!existsSync(VAULT_DIRECTORY)) {
      mkdirSync(VAULT_DIRECTORY, { recursive: true });
    }
  });

  afterAll(() => {
    // Restore original environment variable
    if (originalEnvKey) {
      process.env.CD_CLI_ENCRYPT_KEY = originalEnvKey;
    } else {
      delete process.env.CD_CLI_ENCRYPT_KEY;
    }

    // Clean up test environment
    if (existsSync(envFilePath)) {
      fs.unlinkSync(envFilePath);
    }
  });

  it('should create a new encryption key and save it to .env', () => {
    // Clear environment variable
    delete process.env.CD_CLI_ENCRYPT_KEY;

    const newKey = CdCliVaultController.createEncryptionKey();
    const savedKey = fs
      .readFileSync(envFilePath, 'utf-8')
      .match(/CD_CLI_ENCRYPT_KEY=(.+)/)?.[1];

    expect(newKey).toBeDefined();
    expect(newKey.length).toBe(64); // 32 bytes in hex = 64 chars
    expect(savedKey).toBe(newKey);
  });

  it('should retrieve an existing encryption key from the environment', () => {
    const testKey = crypto.randomBytes(32).toString('hex');
    process.env.CD_CLI_ENCRYPT_KEY = testKey;

    const retrievedKey = CdCliVaultController.getEncryptionKey();
    expect(retrievedKey.toString()).toBe(testKey);
  });

  it('should update an existing encryption key in the .env file', () => {
    const testKey = crypto.randomBytes(32).toString('hex');
    CdCliVaultController.saveEncryptionKey(testKey);

    const savedKey = fs
      .readFileSync(envFilePath, 'utf-8')
      .match(/CD_CLI_ENCRYPT_KEY=(.+)/)?.[1];
    expect(savedKey).toBe(testKey);
  });

  it('should throw an error for an invalid encryption key length', () => {
    process.env.CD_CLI_ENCRYPT_KEY = 'shortkey';

    expect(() => {
      CdCliVaultController.getEncryptionKey();
    }).toThrowError(/Invalid encryption key length/);
  });
});
