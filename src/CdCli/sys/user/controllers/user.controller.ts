/* eslint-disable style/operator-linebreak */
/* eslint-disable style/brace-style */
import type { ICdResponse, ISessResp } from '../../base/IBase.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path, { dirname, join } from 'node:path';
// import { fileURLToPath } from 'node:url';
import inquirer from 'inquirer';
import config, { CONFIG_FILE_PATH, DEFAULT_SESS } from '../../../../config.js';
// Import the environment config
import { HttpService } from '../../base/http.service.js';
import { CdCliProfileController } from '../../cd-cli/controllers/cd-cli-profile.cointroller.js';
import CdCliVaultController from '../../cd-cli/controllers/cd-cli-vault.controller.js';
import { VAULT_DIRECTORY } from '../../cd-cli/models/cd-cli-vault.model.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { DEFAULT_ENVELOPE_LOGIN } from '../models/user.model.js';
import { SessonController } from './session.controller.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

export class UserController {
  // svServer = new HttpService();
  ctlSession = new SessonController();
  ctlCdCliProfile = new CdCliProfileController();
  // private SESSION_FILE_STORE = join(__dirname, SESSION_FILE_STORE);

  init(debugLevel) {
    CdLog.setDebugLevel(debugLevel);
  }

  async auth(userName: string, password: string): Promise<void> {
    try {
      const ctlCdCliProfile = new CdCliProfileController();
      // Load the configuration file
      const resultProfile = await ctlCdCliProfile.loadProfiles();
      if (!resultProfile.state || !resultProfile.data) {
        return;
      }

      const cdCliConfig = resultProfile.data;
      // Find the profile named config.cdApiLocal
      const profile = cdCliConfig.items.find(
        (item: any) => item.cdCliProfileName === config.cdApiLocal,
      );

      CdLog.debug('UserController::auth()/profile:', profile);

      if (!profile || !profile.cdCliProfileData?.details?.consumerToken) {
        throw new Error(
          `Profile config.cdApiLocal with 'consumerToken' not found in configuration.`,
        );
      }

      // Handle deferred value in consumerToken
      let consumerGuid = profile.cdCliProfileData.details.consumerToken;
      CdLog.debug('UserController::auth()/consumerGuid:', {
        ct: consumerGuid,
      });

      if (
        typeof consumerGuid === 'string' &&
        consumerGuid.startsWith('#cdVault[')
      ) {
        const vaultName = consumerGuid.match(/#cdVault\['(.+?)'\]/)?.[1];
        if (!vaultName) {
          throw new Error(
            `Invalid cdVault reference in consumerToken: ${consumerGuid}`,
          );
        }

        // Find the matching cdVault item
        const cdVaultItem = profile.cdCliProfileData.cdVault?.find(
          (vault: any) => vault.name === vaultName,
        );

        CdLog.debug('UserController::auth()/cdVaultItem:', cdVaultItem);

        if (!cdVaultItem) {
          throw new Error(`cdVault item '${vaultName}' not found.`);
        }

        // Extract value or decrypt if encrypted
        if (cdVaultItem.isEncrypted && cdVaultItem.encryptedValue) {
          consumerGuid = CdCliVaultController.getSensitiveData(cdVaultItem);
        } else {
          consumerGuid = cdVaultItem.value;
        }

        if (!consumerGuid) {
          throw new Error(
            `ConsumerToken could not be resolved for '${vaultName}'.`,
          );
        }
      }

      // Prompt for password if not provided
      if (!password) {
        const inquirer:any = await import('inquirer');
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'password',
            message: 'Please enter your password:',
            mask: '*',
          },
        ]);
        password = answers.password;
      }

      // Prepare payload using DEFAULT_ENVELOPE_LOGIN
      const payload = { ...DEFAULT_ENVELOPE_LOGIN };
      payload.dat.f_vals[0].data.userName = userName;
      payload.dat.f_vals[0].data.password = password;
      payload.dat.f_vals[0].data.consumerGuid = consumerGuid;

      CdLog.info('Authenticating...');
      CdLog.info('Payload:', payload);

      // Initialize HttpService
      const httpService = new HttpService(true); // Enable debug mode
      const baseUrl = await httpService.getCdApiUrl(config.cdApiLocal);

      if (baseUrl) {
        await httpService.init();
        const responseResult = await httpService.proc(payload);
        if (!responseResult.state || !responseResult.data) {
          return;
        }

        const response = responseResult.data;
        CdLog.info('Response:', response);

        if (response.app_state?.success) {
          if (response.app_state?.sess) {
            this.ctlSession.saveSession(
              response.app_state.sess,
              config.cdApiLocal,
            );

            const cdToken = response.app_state.sess.cd_token;
            const profileController = new CdCliProfileController();

            if (cdToken) {
              await profileController.fetchAndSaveProfiles(cdToken);
            } else {
              CdLog.error('Could not save profiles due to an invalid session.');
            }
          }
        } else {
          CdLog.error(
            'Login failed:',
            response.app_state?.info || { error: 'Unknown error' },
          );
          throw new Error(
            'Login failed. Please check your credentials and try again.',
          );
        }
      } else {
        CdLog.error('Could not get base url for HTTP connection.');
      }
    } catch (error: any) {
      CdLog.error('Error during login:', error.message);
    }
  }

  // Login wizard method with retry attempts
  async loginWithRetry() {
    // const inquirer: any = await import('inquirer');
    let attempts = 0;
    while (attempts < 3) {
      try {
        attempts++;

        CdLog.info(`Attempt ${attempts} of 3: Please log in.`);

        // Prompt for username
        const usernameAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'userName',
            message: 'Enter your username:',
          },
        ]);

        // Call auth method from UserController to handle login
        await this.auth(usernameAnswer.userName, '');

        // Check if login was successful by verifying session
        if (await this.ctlSession.getSession(config.cdApiLocal)) {
          CdLog.success('Login successful!');
          return; // Exit login retry loop if successful
        } else {
          CdLog.error('Login failed. Please try again.');
        }
      } catch (error: any) {
        CdLog.error('Error during login attempt:', error.message);
      }

      // If the user exceeds 3 attempts, exit with an error message
      if (attempts >= 3) {
        CdLog.error('Too many failed login attempts. Exiting.');
        break;
      }
    }
  }

  /**
   * Log out by clearing the session.
   */
  logout(): void {
    try {
      if (existsSync(CONFIG_FILE_PATH)) {
        const config = JSON.parse(readFileSync(CONFIG_FILE_PATH, 'utf-8'));
        // Clear session section from config
        config.session = { ...DEFAULT_SESS }; // Set session to default

        // Write updated config to file
        writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
        CdLog.info('Logged out successfully and session cleared.');
      } else {
        CdLog.error('Config file not found.');
      }
    } catch (error) {
      CdLog.error(`Error during logout: ${(error as Error).message}`);
    }
  }
}
