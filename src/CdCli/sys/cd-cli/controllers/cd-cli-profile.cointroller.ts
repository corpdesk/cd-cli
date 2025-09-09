/* eslint-disable antfu/if-newline */
/* eslint-disable node/prefer-global/process */
/* eslint-disable style/operator-linebreak */
import {
  CD_FX_FAIL,
  type CdFxReturn,
  type ICdResponse,
  type IJsonUpdate,
  type IQuery,
  type ISessResp,
} from '../../base/i-base.js';
import type {
  ProfileContainer,
  ProfileData,
  ProfileModel,
} from '../models/cd-cli-profile.model.js';
// import { fileURLToPath } from 'node:url';
/* eslint-disable style/brace-style */
import inquirer from 'inquirer';
// import config, { PROFILE_FILE_STORE } from '../../../../config';
import { UserController } from '../../user/controllers/user.controller.js';
import { createProfilePromptData } from '../models/cd-cli-profile.model.js';
import { CdCliProfileService } from '../services/cd-cli-profile.service.js';

// const fsAccess = promisify(fs.access);

import { ENCRYPTION_CONFIGS, type CdVaultItem } from '../models/cd-cli-vault.model.js';
import fs, { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import path from 'node:path';
import config, { CONFIG_FILE_PATH } from '../../../../config.js';
import { printTable } from '../../base/cli-table.js';
import { HttpService } from '../../base/http.service.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { SessonController } from '../../user/controllers/session.controller.js';
import CdCliVaultController from './cd-cli-vault.controller.js';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const homeDirectory =
  process.env.HOME || process.env.USERPROFILE || '/home/username'; // Fallback if HOME is undefined
const PROFILE_DIRECTORY = join(homeDirectory, '.cd-cli');
// import { CdLog } from './logger'; // Adjust this import as per your project structure

// const PROFILE_FILE_STORE = './profile.json'; // Adjust the file path as necessary
// const TIMEOUT = 1000; // Timeout to wait for file to become available (in ms)

export class CdCliProfileController {
  // svUser = new UserController();
  ctlSession = new SessonController();
  cdToken: string | null = null;
  svCdCliProfile = new CdCliProfileService();
  private profiles: ProfileContainer;
  // private profilesFilePath = join(__dirname, PROFILE_FILE_STORE);

  // constructor() {
  //   this.profiles = this.loadProfiles();
  // }
  constructor() {
    this.profiles = {} as ProfileContainer; // Initialize with an empty object
    this.initializeProfiles().then((result) => {
      if (!result.state) {
        CdLog.error(`Profile initialization failed: ${result.message}`);
      }
    });
  }

  private async initializeProfiles(): Promise<CdFxReturn<void>> {
    try {
      const profileResult = await this.loadProfiles();

      if (!profileResult.state || !profileResult.data) {
        const message = `Failed to load profiles: ${profileResult.message}`;
        CdLog.error(message);
        return { data: null, state: false, message };
      }

      this.profiles = profileResult.data;
      // CdLog.debug('Profiles loaded successfully:', this.profiles);

      return {
        data: null,
        state: true,
        message: 'Profiles initialized successfully',
      };
    } catch (error) {
      const errorMessage = `Error initializing profiles: ${(error as Error).message}`;
      CdLog.error(errorMessage);
      return { data: null, state: false, message: errorMessage };
    }
  }

  /**
   *
   * @param profileFilePath
   * @returns
   */
  async createProfile(profileFilePath: string): Promise<void> {
    CdLog.debug(
      `CdCliProfileController::createProfile()/profileFilePath:${profileFilePath}`,
    );
    try {
      // Ensure profile.json exists or trigger login process
      await this.checkProfileAndLogin(); // Will prompt for login if profile.json doesn't exist

      // Step 1: Read the profile template from the given file path (profileTemp.json)
      const profileTemplate = JSON.parse(
        fs.readFileSync(profileFilePath, 'utf-8'),
      );
      CdLog.debug(
        `CdCliProfileController::createProfile()/profileTemplate: ${profileTemplate}`,
      );
      const profileType = profileTemplate.type; // Get the profile type (ssh, api, etc.)

      // Step 2: Read sensitive details from the respective JSON file
      CdLog.debug(
        `CdCliProfileController::createProfile()/PROFILE_DIRECTORY: ${PROFILE_DIRECTORY}`,
      );
      CdLog.debug(
        `CdCliProfileController::createProfile()/profileType: ${profileType}`,
      );
      const detailsFilePath = join(PROFILE_DIRECTORY, `${profileType}.json`);
      CdLog.debug(
        `CdCliProfileController::createProfile()/filePath: ${detailsFilePath}`,
      );

      // 🛡️ Sanitize (encrypt) details before loading into memory
      const sanitizeResult = await this.sanitizeProfileDetails(detailsFilePath);

      if (!sanitizeResult.state) {
        CdLog.error(`Sanitization failed: ${sanitizeResult.message}`);
        return;
      }

      if (sanitizeResult.data?.length === 0) {
        CdLog.warning(
          `No sensitive fields were encrypted in ${detailsFilePath}. Continuing with caution...`,
        );
      }

      const profileDetails = this.loadProfileDetails(detailsFilePath);
      CdLog.debug(
        `CdCliProfileController::createProfile()/profileDetails: ${profileDetails}`,
      );

      // Step 3: Prompt user for profile details based on the template (generic for any profile)
      // const inquirer: any = await import('inquirer');
      const answers = await inquirer.prompt(
        createProfilePromptData(profileType),
      );

      // Step 4: Populate the profile template with user input and sensitive details
      const profileData: ProfileData = {
        ...profileTemplate,
        details: { ...profileTemplate.details, ...answers, ...profileDetails },
      };

      // Step 5: Prepare the payload to send to the API
      const sessResp = await this.ctlSession.getSession(config.cdApiLocal);
      if (!sessResp || !sessResp.cd_token) {
        CdLog.error('Invalid session. Please log in again.');
        return;
      }
      this.cdToken = sessResp.cd_token;

      const d = {
        data: {
          cdCliProfileName: answers.profileName,
          cdCliProfileDescription: answers.description,
          cdCliProfileData: profileData,
          cdCliProfileEnabled: true,
          cdCliProfileTypeId: profileTemplate.typeId,
          userId: 1010, // Adjust based on the session or logged in user
        },
      };

      // Step 6: Send the profile data to the API for profile creation
      CdLog.debug(
        `CdCliProfileController::createProfile()/sessResp: ${JSON.stringify(sessResp)}`,
      );
      CdLog.debug(
        `CdCliProfileController::createProfile()/this.cdToken: ${this.cdToken}`,
      );
      const response: any = await this.svCdCliProfile.createCdCliProfile(
        d,
        sessResp.cd_token,
      );
      if (response.app_state?.success) {
        CdLog.success(`Profile '${answers.profileName}' created successfully.`);
      } else {
        CdLog.error(
          `Profile creation failed:${JSON.stringify(response.app_state?.info)}`,
        );
      }
    } catch (error) {
      CdLog.error(`Error creating profile: ${(error as Error).message}`);
    }
  }

  async loadProfiles(): Promise<CdFxReturn<ProfileContainer>> {
    // CdLog.debug('starting loadCdCliConfig()');

    try {
      // Ensure profile check and login before loading config
      const profileCheck = await this.checkProfileAndLogin();
      if (!profileCheck.state) {
        return {
          data: null,
          state: false,
          message: `Profile check failed: ${profileCheck.message}`,
        };
      }

      // Check if configuration file exists
      if (!existsSync(CONFIG_FILE_PATH)) {
        return {
          data: null,
          state: false,
          message: `Configuration file not found at ${CONFIG_FILE_PATH}.`,
        };
      }

      // Load and parse the configuration file
      const configContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const parsedConfig = JSON.parse(configContent);

      return {
        data: parsedConfig,
        state: true,
        message: 'Configuration loaded successfully.',
      };
    } catch (error) {
      CdLog.error(`Error loading configuration: ${(error as Error).message}`);
      return {
        data: null,
        state: false,
        message: `Error loading configuration: ${(error as Error).message}`,
      };
    }
  }

  private loadProfileDetails(filePath: string): any {
    CdLog.debug(`CdCliProfileController::loadProfileDetails: ${filePath}`);
    try {
      if (!existsSync(filePath)) {
        CdLog.warning(`Profile details file not found: ${filePath}`);
        return {};
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      CdLog.error(
        `Error reading profile details from file: ${(error as Error).message}`,
      );
      return {};
    }
  }

  async sanitizeProfileDetails(
    detailsPath: string,
  ): Promise<CdFxReturn<string[]>> {
    try {
      const raw = JSON.parse(readFileSync(detailsPath, 'utf-8'));
      const cryptFields: string[] = raw.cryptFields || [];

      // Case: Already encrypted
      if (raw.encrypted) {
        return {
          data: [],
          state: true,
          message: `File already encrypted: ${detailsPath}`,
        };
      }

      // Case: No fields marked for encryption
      if (cryptFields.length === 0) {
        const msg = `No fields marked for encryption in: ${detailsPath}`;
        CdLog.warning(msg);
        return {
          data: [],
          state: false,
          message: msg,
        };
      }

      // Proceed to encrypt fields
      const encryptedFields: string[] = [];

      for (const field of cryptFields) {
        const value = raw[field];
        if (typeof value === 'string' && value.trim() !== '') {
          const vaultEntry = await CdCliVaultController.encrypt(
            value,
            'default',
          );
          if (vaultEntry) {
            vaultEntry.name = field;
            raw[field] = vaultEntry;
            encryptedFields.push(field);
          }
        }
      }

      raw.encrypted = true;
      writeFileSync(detailsPath, JSON.stringify(raw, null, 2));

      return {
        data: encryptedFields,
        state: true,
        message: `Encrypted ${encryptedFields.length} field(s) in ${detailsPath}`,
      };
    } catch (error) {
      const msg = `Sanitization failed: ${(error as Error).message}`;
      CdLog.error(msg);
      return {
        ...CD_FX_FAIL,
        message: msg,
      };
    }
  }

  // async sanitizeProfileDetails2(
  //   detailsPath: string,
  // ): Promise<CdFxReturn<string[]>> {
  //   try {
  //     const raw = JSON.parse(readFileSync(detailsPath, 'utf-8'));
  //     const cryptFields: string[] = raw.cryptFields || [];

  //     if (raw.encrypted) {
  //       return {
  //         data: [],
  //         state: true,
  //         message: `File already encrypted: ${detailsPath}`,
  //       };
  //     }

  //     if (cryptFields.length === 0) {
  //       const msg = `No fields marked for encryption in: ${detailsPath}`;
  //       CdLog.warning(msg);
  //       return {
  //         data: [],
  //         state: false,
  //         message: msg,
  //       };
  //     }

  //     const encryptedFields: string[] = [];

  //     for (const field of cryptFields) {
  //       const value = raw[field];

  //       if (typeof value === 'string' && value.trim() !== '') {
  //         if (value.startsWith('$')) {
  //           const varName = value.slice(1);
  //           const envValue = process.env[varName];
  //           if (!envValue) {
  //             return {
  //               data: [],
  //               state: false,
  //               message: `Environment variable '${varName}' is not defined.`,
  //             };
  //           }
  //           // Store as-is without encryption
  //           CdLog.info(`Using env reference for '${field}': $${varName}`);
  //         } else {
  //           const vaultEntry = await CdCliVaultController.encrypt(
  //             value,
  //             'default',
  //           );
  //           if (vaultEntry) {
  //             vaultEntry.name = field;
  //             raw[field] = vaultEntry;
  //             encryptedFields.push(field);
  //           }
  //         }
  //       }
  //     }

  //     raw.encrypted = true;
  //     writeFileSync(detailsPath, JSON.stringify(raw, null, 2));

  //     return {
  //       data: encryptedFields,
  //       state: true,
  //       message: `Encrypted fields saved successfully.`,
  //     };
  //   } catch (error) {
  //     return {
  //       data: [],
  //       state: false,
  //       message: `Encryption error: ${(error as Error).message}`,
  //     };
  //   }
  // }

  async fetchAndSaveProfiles(cdToken: string): Promise<void> {
    CdLog.debug('starting fetchAndSaveProfiles():', { token: cdToken });

    if (!cdToken) {
      CdLog.error('No valid cdToken found. Cannot fetch profiles.');
      return;
    }

    // Prepare the query object to fetch profiles
    const q = {
      where: { userId: -1 }, // userId of -1 signals backend to use the cdToken to derive the userId
    };

    try {
      CdLog.info('Fetching profiles from backend...');
      const response: ICdResponse = await this.svCdCliProfile.getCdCliProfile(
        q,
        cdToken,
      );

      if (response.app_state?.success) {
        // Fetch existing configuration or create a new structure
        let configData: any = {
          items: [],
          count: 0,
        };

        if (existsSync(CONFIG_FILE_PATH)) {
          configData = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf-8'));
        }

        // Overwrite the entire profiles section in the config file
        const profiles: ProfileContainer = response.data;

        if (!profiles || profiles.items.length === 0) {
          CdLog.info('No profiles found. Writing empty profiles section.');
          configData.items = [];
          configData.count = 0;
        } else {
          CdLog.info(`Fetched ${profiles.count} profiles.`);
          configData.items = profiles.items.map((profile: ProfileModel) => ({
            cdCliProfileName: profile.cdCliProfileName,
            cdCliProfileData: profile.cdCliProfileData,
            cdCliProfileTypeId: profile.cdCliProfileTypeId,
            cdCliProfileGuid: profile.cdCliProfileGuid,
            userId: profile.userId,
            cdCliProfileEnabled: profile.cdCliProfileEnabled,
          }));
          configData.count = profiles.count;
        }

        // Write the updated config data to cd-cli.profiles.json
        fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(configData, null, 2));
        CdLog.success(`Profiles saved successfully to ${CONFIG_FILE_PATH}`);
      } else {
        CdLog.error(
          `Failed to fetch profiles: ${response.app_state?.info?.app_msg || 'Unknown error'}`,
        );
      }
    } catch (error: any) {
      CdLog.error('Error fetching profiles:', error.message);
    }
  }

  async checkProfileAndLogin(): Promise<CdFxReturn<void>> {
    try {
      // Resolve the path to the configuration file
      const configFilePath = CONFIG_FILE_PATH; // Assuming this constant points to ~/.cd-cli/cd-cli.profiles.json
      // CdLog.debug(`config file: ${configFilePath}`);

      // Step 1: Check if the configuration file exists
      if (!existsSync(configFilePath)) {
        CdLog.warning(
          `Configuration file ${configFilePath} not found. Initiating login process...`,
        );

        const userController = new UserController();
        await userController.loginWithRetry();

        // Verify if the configuration file was created after login
        if (!existsSync(configFilePath)) {
          return {
            data: null,
            state: false,
            message: 'Configuration file not found after login attempt.',
          };
        }
      }

      // Step 2: Load and parse the configuration file
      const cdCliConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
      // CdLog.debug(`cdCliConfig: ${JSON.stringify(cdCliConfig)}`);

      // Step 3: Validate profiles section
      if (!cdCliConfig.items || cdCliConfig.items.length === 0) {
        CdLog.warning(
          'No profiles available in the configuration. Consider creating one.',
        );
        return {
          data: null,
          state: false,
          message: 'No profiles available in the configuration.',
        };
      }

      // Step 4: Look for the "cd-api-local" profile
      const cdApiProfile = cdCliConfig.items.find(
        (profile: any) => profile.cdCliProfileName === config.cdApiLocal,
      );

      if (!cdApiProfile || !cdApiProfile.cdCliProfileData) {
        return {
          data: null,
          state: false,
          message:
            'Profile "cd-api-local" is missing or invalid. Please log in to create the profile.',
        };
      }

      // Step 5: Check for a valid session token in the "cd-api-local" profile
      const session: ISessResp = cdApiProfile.cdCliProfileData.details?.session;
      if (
        !session ||
        !session.cd_token
        // ||
        // new Date(session.initTime) <= new Date()
      ) {
        CdLog.info(
          'Session token is missing or expired. Initiating login process...',
        );

        const userController = new UserController();
        await userController.loginWithRetry();

        // Re-check the profile after login
        const updatedConfig = JSON.parse(
          fs.readFileSync(configFilePath, 'utf-8'),
        );
        const updatedProfile = updatedConfig.profiles.items.find(
          (profile: any) => profile.cdCliProfileName === config.cdApiLocal,
        );

        if (
          !updatedProfile ||
          !updatedProfile.cdCliProfileData?.details?.session
        ) {
          return {
            data: null,
            state: false,
            message:
              'Session token is still missing after login. Please check your login credentials.',
          };
        }

        CdLog.success('Session token renewed successfully.');
      } else {
        // CdLog.info('Valid session token found. Proceeding...');
        this.cdToken = session.cd_token;
      }

      return { data: null, state: true, message: 'Profile check successful.' };
    } catch (error) {
      CdLog.error(
        `Error during profile check or login: ${(error as Error).message}`,
      );
      return {
        data: null,
        state: false,
        message: `Error during profile check or login: ${(error as Error).message}`,
      };
    }
  }

  // Method to list all profiles
  // Usage:
  // cd-cli profile list
  // Method to list all profiles in a table format
  async listProfiles(): Promise<void> {
    try {
      await this.checkProfileAndLogin();

      // const configFilePath = path.resolve('./cd-cli.profiles.json');
      // const config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
      // const profilesData = config.profiles;

      const profilesData = this.profiles;

      if (!profilesData || profilesData.items.length === 0) {
        CdLog.info('No profiles available.');
        return;
      }

      const rows = profilesData.items.map((profile: any) => [
        profile.cdCliProfileName,
        profile.cdCliProfileDescription || 'No description provided',
      ]);

      printTable(['Profile Name', 'Description'], rows);
    } catch (error) {
      CdLog.error(`Error listing profiles: ${(error as Error).message}`);
    }
  }

  // Method to remove a profile by name
  // Usage:
  // cd-cli remove <profile-name>
  async removeProfile(profileName: string): Promise<void> {
    try {
      const configFilePath = path.resolve('./cd-cli.profiles.json');
      if (!existsSync(configFilePath)) {
        CdLog.error('Configuration file not found.');
        return;
      }

      const config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
      const profilesData = config.profiles;

      const profileIndex = profilesData.items.findIndex(
        (profile: any) => profile.cdCliProfileName === profileName,
      );

      if (profileIndex === -1) {
        CdLog.error(`Profile '${profileName}' not found.`);
        return;
      }

      profilesData.items.splice(profileIndex, 1);
      profilesData.count--;

      fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));

      CdLog.success(`Profile '${profileName}' removed successfully.`);
    } catch (error) {
      CdLog.error(`Error removing profile: ${(error as Error).message}`);
    }
  }

  // Method to show profile details by name
  // Usage:
  // cd-cli profile show <profile-name>
  async showProfile(profileName: string): Promise<void> {
    try {
      const configFilePath = path.resolve('./cd-cli.profiles.json');
      if (!existsSync(configFilePath)) {
        CdLog.error('Configuration file not found.');
        return;
      }

      const config = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
      const profilesData = config.profiles;

      const profile = profilesData.items.find(
        (profile: any) => profile.cdCliProfileName === profileName,
      );

      if (!profile) {
        CdLog.error(`Profile '${profileName}' not found.`);
        return;
      }

      CdLog.info(`Details of profile '${profileName}':`);
      CdLog.info(`- Name: ${profile.cdCliProfileName}`);
      CdLog.info(
        `- Description: ${profile.cdCliProfileDescription || 'No description provided'}`,
      );
      CdLog.info(
        `- SSH Key Path: ${profile.cdCliProfileData.details.sshKey || 'N/A'}`,
      );
      CdLog.info(
        `- Remote User: ${profile.cdCliProfileData.details.remoteUser || 'N/A'}`,
      );
      CdLog.info(
        `- Development Server: ${profile.cdCliProfileData.details.devServer || 'N/A'}`,
      );
      CdLog.info(
        `- Directory on Server: ${profile.cdCliProfileData.details.cdApiDir || 'N/A'}`,
      );
    } catch (error) {
      CdLog.error(`Error showing profile: ${(error as Error).message}`);
    }
  }

  async saveCdCliProfileLocal(
    profile: ProfileModel,
    profileName: string | null = null,
    profileId: number | null = null,
  ): Promise<boolean> {
    try {
      // Load existing configuration
      let config: ProfileContainer = { items: [], count: 0 };

      if (existsSync(CONFIG_FILE_PATH)) {
        const configFileContent = readFileSync(CONFIG_FILE_PATH, 'utf-8');
        config = JSON.parse(configFileContent) as ProfileContainer;
      }

      // Locate the profile if name or id is provided
      const existingProfileIndex = config.items.findIndex((item) => {
        if (profileId !== null) return item.cdCliProfileId === profileId;
        if (profileName !== null) return item.cdCliProfileName === profileName;
        return false;
      });

      // Update the profile if it exists, else add it
      if (existingProfileIndex !== -1) {
        config.items[existingProfileIndex] = profile;
        CdLog.info(`Updated existing profile: ${profileName || profileId}`);
      } else {
        config.items.push(profile);
        CdLog.info(
          `Added new profile: ${profileName || profile.cdCliProfileId}`,
        );
      }

      // Update the count
      config.count = config.items.length;

      // Save the updated configuration back to the file
      writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');

      CdLog.success('Profile successfully saved to local configuration.');
      return true;
    } catch (error) {
      CdLog.error(`Failed to save profile: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Get a profile by its name.
   * @param profileName The name of the profile to fetch.
   * @returns The ProfileModel if found, otherwise throws an error.
   */
  // async getProfileByName(profileName: string): Promise<ProfileModel> {
  //   const profile = this.profiles.items.find(
  //     (item) => item.cdCliProfileName === profileName,
  //   );

  //   if (!profile) {
  //     throw new Error(`Profile '${profileName}' not found.`);
  //   }

  //   return profile;
  // }
  async getProfileByName(
    profileName: string,
  ): Promise<CdFxReturn<ProfileModel>> {
    try {
      CdLog.debug(
        `getProfileByName()/this.profiles: ${JSON.stringify(this.profiles)}`,
      );
      // Validate that profiles exist
      if (
        !this.profiles ||
        !this.profiles.items ||
        this.profiles.items.length === 0
      ) {
        CdLog.debug(`The profile is not initialized. Trying to initialize...`);
        const profileResult = await this.loadProfiles();
        // CdLog.debug(
        //   `getProfileByName()/profileResult: ${JSON.stringify(profileResult)}`,
        // );
        // CdLog.debug(
        //   `getProfileByName()/profileResult.data?.items: ${JSON.stringify(profileResult.data?.items)}`,
        // );
        if (!profileResult.state || !profileResult.data) {
          const message = `Failed to load profiles: ${profileResult.message}`;
          CdLog.error(message);
          return { data: null, state: false, message };
        }
        this.profiles = profileResult.data;
      }

      // Find the profile by name
      const profile = this.profiles.items.find(
        (item) => item.cdCliProfileName === profileName,
      );

      if (!profile) {
        return {
          data: null,
          state: false,
          message: `Profile '${profileName}' not found. Please check the name or log in.`,
        };
      }

      return {
        data: profile,
        state: true,
        message: `Profile '${profileName}' retrieved successfully.`,
      };
    } catch (error) {
      CdLog.error(`getProfileByName() failed: ${(error as Error).message}`);
      return {
        data: null,
        state: false,
        message: `Error retrieving profile: ${(error as Error).message}`,
      };
    }
  }

  /**
  //  * Extracts the session token from the profile.
  //  * @param profileName The name of the profile.
  //  * @returns The session token if found, otherwise null.
  //
   */
  // async getSessionData(): Promise<string | null> {
  //   CdLog.debug('CdCliProfileController::getSessionData()/starting...');
  //   // get cd-api profile
  //   const profile = await this.getProfileByName(config.cdApiLocal);
  //   return this.extractVaultValue(profile, 'cd_token');
  // }

  // /**
  //  * Extracts the consumer token from the profile.
  //  * @param profileName The name of the profile.
  //  * @returns The consumer token if found, otherwise null.
  //  */
  // async getConsumerToken(): Promise<string | null> {
  //   const profile = await this.getProfileByName(config.cdApiLocal);
  //   return this.extractVaultValue(profile, 'consumerToken');
  // }
  async getSessionData(): Promise<CdFxReturn<string>> {
    CdLog.debug('CdCliProfileController::getSessionData()/starting...');

    const profileResult = await this.getProfileByName(config.cdApiLocal);
    // CdLog.debug(
    //   `getSessionData()/profileResult: ${JSON.stringify(profileResult)}`,
    // );
    if (!profileResult.state || !profileResult.data) {
      return {
        data: null,
        state: false,
        message: `Failed to retrieve profile for session data: ${profileResult.message}`,
      };
    }

    return this.extractVaultValue(profileResult.data, 'cd_token');
  }

  async getConsumerToken(): Promise<CdFxReturn<string>> {
    const profileResult = await this.getProfileByName(config.cdApiLocal);
    if (!profileResult.state || !profileResult.data) {
      return {
        data: null,
        state: false,
        message: `Failed to retrieve profile for consumer token: ${profileResult.message}`,
      };
    }

    return this.extractVaultValue(profileResult.data, 'consumerToken');
  }

  // /**
  //  * Extracts the API endpoint from the profile.
  //  * @param profileName The name of the profile.
  //  * @returns The API endpoint if available.
  //  */
  // async getEndPoint(): Promise<string | null> {
  //   const profile = await this.getProfileByName(config.cdApiLocal);
  //   return profile.cdCliProfileData?.details?.cdEndpoint || null;
  // }

  // /**
  //  * Extracts user permissions from the profile.
  //  * @param profileName The name of the profile.
  //  * @returns The user permissions object if found.
  //  */
  // async getUserPermissions() {
  //   const profile = await this.getProfileByName(config.cdApiLocal);
  //   return (
  //     profile.cdCliProfileData?.details?.permissions?.userPermissions || []
  //   );
  // }

  async getEndPoint(): Promise<CdFxReturn<string>> {
    const profileResult = await this.getProfileByName(config.cdApiLocal);

    if (!profileResult.state || !profileResult.data) {
      return {
        data: null,
        state: false,
        message: `Failed to retrieve profile for endpoint: ${profileResult.message}`,
      };
    }

    const endpoint =
      profileResult.data.cdCliProfileData?.details?.cdEndpoint || null;

    return {
      data: endpoint,
      state: endpoint !== null,
      message: endpoint
        ? 'Endpoint retrieved successfully.'
        : 'Endpoint not found in profile.',
    };
  }

  async getUserPermissions(): Promise<CdFxReturn<string[]>> {
    const profileResult = await this.getProfileByName(config.cdApiLocal);

    if (!profileResult.state || !profileResult.data) {
      return {
        data: [],
        state: false,
        message: `Failed to retrieve profile for user permissions: ${profileResult.message}`,
      };
    }

    const userPermissions =
      profileResult.data.cdCliProfileData?.details?.permissions
        ?.userPermissions || [];

    return {
      data: userPermissions,
      state: true,
      message: 'User permissions retrieved successfully.',
    };
  }

  // /**
  //  * Helper method to extract a value from cdVault by name.
  //  * @param profile The profile model.
  //  * @param key The key to extract.
  //  * @returns The corresponding value if found, otherwise null.
  //  */
  // private extractVaultValue(profile: ProfileModel, key: string): string | null {
  //   const vaultItem = profile.cdCliProfileData?.cdVault.find(
  //     (item: CdVault) => item.name === key,
  //   );
  //   return vaultItem ? vaultItem.value : null;
  // }
  private extractVaultValue(
    profile: ProfileModel,
    key: string,
  ): CdFxReturn<string> {
    if (!profile.cdCliProfileData?.cdVault) {
      return {
        data: null,
        state: false,
        message: 'Vault data is missing in the profile.',
      };
    }

    const vaultItem = profile.cdCliProfileData.cdVault.find(
      (item: CdVaultItem) => item.name === key,
    );

    if (!vaultItem) {
      return {
        data: null,
        state: false,
        message: `Key '${key}' not found in the profile vault.`,
      };
    }

    return {
      data: vaultItem.value,
      state: true,
      message: `Successfully retrieved value for key '${key}'.`,
    };
  }
}
