/* eslint-disable style/brace-style */
/* eslint-disable antfu/if-newline */

import type { CdFxReturn, ICdRequest } from '../../base/IBase.js';
import type { BaseDescriptor } from './base-descriptor.model.js';
import type { EnvironmentDescriptor } from './environment.model.js';
import type { MigrationDescriptor } from './migration-descriptor.model.js';
import type { TestingFrameworkDescriptor } from './testing-framework.model.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { EnvironmentService } from '../services/environment.service.js';
import { CdVaultItem } from '../../cd-cli/models/cd-cli-vault.model.js';

// Main CiCdDescriptor Interface
export interface CiCdDescriptor extends BaseDescriptor {
  dsFormart?: 'json' | 'csv' | 'sql-db';
  cICdPipeline?: CICdPipeline; // Details of the pipeline
  cICdTriggers?: CICdTrigger; // Details of the triggers
  cICdEnvironment?: CICdEnvironment; // Details of the environment
  cICdNotifications?: CICdNotification; // Details of the notifications
  cICdMetadata?: CICdMetadata; // Metadata information
}

// Interface for Pipeline
export interface CICdPipeline extends BaseDescriptor {
  name: string; // Name of the pipeline (e.g., "Build and Deploy Pipeline")
  type:
    | 'integration'
    | 'delivery'
    | 'deployment'
    | 'dev-env-setup'
    | 'cd-module-development'; // Type of pipeline
  stages: CICdStage[]; // List of stages in the pipeline
}

// Interface for Triggers
export interface CICdTrigger extends BaseDescriptor {
  type: 'push' | 'pull_request' | 'schedule' | 'manual' | 'other'; // Trigger type
  schedule?: string; // Cron-like schedule (e.g., "0 0 * * *")
  branchFilters?: string[]; // Branches that trigger the pipeline
  conditions?: CICdTriggerConditions; // Conditions for triggering the pipeline
}

// Interface for Environment
export interface CICdEnvironment extends BaseDescriptor {
  name: string; // Name of the environment (e.g., "staging", "production")
  url: string; // Environment URL
  type: 'staging' | 'production' | 'testing' | 'custom'; // Environment type
  deploymentStrategy: 'blue-green' | 'canary' | 'rolling' | 'recreate'; // Deployment strategy
}

export interface CICdStage extends BaseDescriptor {
  name: string; // Name of the stage (e.g., "Build", "Test", "Deploy")
  description?: string; // Description of the stage
  tasks: CICdTask[]; // List of tasks in the stage
}

export interface CICdTask<T = any> extends BaseDescriptor {
  name: string;
  type: 'script-inline' | 'script-file' | 'method' | 'cdRequest';
  executor: ExecutionEnvironmentType; // Defines the execution environment
  script?: string; // Used for inline scripts
  cdRequest?: ICdRequest; // Optionally ICdRequest json can be used to invoke a given action
  scriptFile?: string; // Used when the script is a file
  className?: string; // Used when calling a cd-cli method
  methodName?: string; // The method to be executed
  input?: T; // Optional input for the method
  status: 'pending' | 'running' | 'completed' | 'failed'; // Task execution status
  cdVault?: CdVaultItem[];
  onResult?: TransitionRule[]; // Optional: Define next steps based on the result of the task
  onError?: TransitionRule[]; // Optional: Define next steps on error
  onSuccess?: TransitionRule[]; // Optional: Define next steps on success
  onStart?: TransitionRule[]; // Optional: Define next steps on start
  onEnd?: TransitionRule[]; // Optional: Define next steps on end
  onCancel?: TransitionRule[]; // Optional: Define next steps on cancel
  onTimeout?: TransitionRule[]; // Optional: Define next steps on timeout
  onRetry?: TransitionRule[]; // Optional: Define next steps on retry
  retryCount?: number; // Number of retries allowed for the task
  retryDelay?: number; // Delay in milliseconds before retrying the task
  timeout?: number; // Timeout in milliseconds for the task
}

// export interface ConditionalNext {
//   condition: 'always' | 'never' | 'success' | 'failure';
//   next: WFNext;
// }

export type WFNextRef = string | WFNext;

export interface TransitionRule {
  condition: 'always' | 'never' | 'success' | 'failure'; // if you expand this later
  next: WFNextRef;
}


export interface WFNext {
  pipelineName?: string;
  stageName?: string;
  taskName: string;
}

export type ExecutionEnvironmentType = 'bash' | 'cd-cli' | 'runner';

export const methodRegistry = {
  async installDependencies(
    this: EnvironmentService,
    input?: EnvironmentDescriptor,
  ): Promise<CdFxReturn<null>> {
    if (input?.workstation) {
      return this.installDependencies(input.workstation);
    } else {
      CdLog.warning('Skipping installDependencies: workstation is undefined.');
      return { state: false, data: null };
    }
  },
  async cloneRepositories(
    this: EnvironmentService,
    input?: EnvironmentDescriptor,
  ): Promise<CdFxReturn<null>> {
    if (input) {
      return this.cloneRepositories(input);
    } else {
      CdLog.warning('Skipping cloneRepositories: input is undefined.');
      return { state: false, data: null };
    }
  },
  async configureServices(
    this: EnvironmentService,
    input?: EnvironmentDescriptor,
  ): Promise<CdFxReturn<null>> {
    if (input) {
      return this.configureServices(input);
    } else {
      CdLog.warning('Skipping configureServices: input is undefined.');
      return { state: false, data: null };
    }
  },
  async startServices(
    this: EnvironmentService,
    input?: EnvironmentDescriptor,
  ): Promise<CdFxReturn<null>> {
    if (input) {
      return this.startServices(input);
    } else {
      CdLog.warning('Skipping startServices: input is undefined.');
      return { state: false, data: null };
    }
  },
};

export const CdApiSetupTasks: CICdTask<EnvironmentDescriptor>[] = [
  {
    name: 'installDependencies',
    type: 'script-inline',
    executor: 'bash',
    status: 'pending',
    methodName: 'installDependencies',
  },
  {
    name: 'cloneRepositories',
    type: 'script-inline',
    executor: 'bash',
    status: 'pending',
    methodName: 'cloneRepositories',
  },
  {
    name: 'configureServices',
    type: 'script-inline',
    executor: 'bash',
    status: 'pending',
    methodName: 'configureServices',
  },
  {
    name: 'startServices',
    type: 'script-inline',
    executor: 'bash',
    status: 'pending',
    methodName: 'startServices',
  },
];

// Function to execute a task given its method name and input
export async function executeTask(
  task: CICdTask<EnvironmentDescriptor>,
  input: EnvironmentDescriptor,
) {
  if (task.methodName && methodRegistry[task.methodName]) {
    // Dynamically call the method from the registry
    const result = await methodRegistry[task.methodName].call(
      new EnvironmentService(),
      input,
    );
    return result;
  } else {
    throw new Error(`Method ${task.methodName} not found in the registry.`);
  }
}

// Task type now allows structured descriptors
export type CICdTaskType =
  | BuildDescriptor
  | TestingFrameworkDescriptor
  | DeploymentDescriptor
  | MigrationDescriptor
  | BashScriptDescriptor // ✅ Added support for Bash scripts
  | CICdNotification;

export interface BuildDescriptor extends BaseDescriptor {
  name: 'build';
  buildTool: 'webpack' | 'babel' | 'vite' | 'other';
  sourceDirectory: string; // Directory containing the source files
  outputDirectory: string; // Directory where the build files are stored
  options?: Record<string, any>; // Optional configurations
}

export interface DeploymentDescriptor extends BaseDescriptor {
  name: 'deploy';
  strategy: 'blue-green' | 'rolling' | 'recreate' | 'canary';
  targetEnvironment: string; // E.g., "staging", "production"
  rollback?: boolean; // Whether rollback is enabled
  deploymentScript?: string; // Optional script for deployment
}

// Interface for Trigger Conditions
export interface CICdTriggerConditions extends BaseDescriptor {
  includeTags: boolean; // Whether to include tags in triggers
  excludeBranches?: string[]; // Branches to exclude
}

// Interface for Notification Channels
export interface CICdNotificationChannel extends BaseDescriptor {
  name: string; // Name of the channel (e.g., "Slack", "Email")
  type: 'slack' | 'email' | 'webhook' | 'custom'; // Notification channel type
  recipients?: string[]; // List of recipients
  messageFormat?: 'text' | 'json'; // Format of the message
}

// Interface for Notifications
export interface CICdNotification extends BaseDescriptor {
  channels: CICdNotificationChannel[]; // List of notification channels
  onEvents: ('success' | 'failure' | 'start' | 'end')[]; // Events that trigger notifications
}

// Interface for Metadata
export interface CICdMetadata extends BaseDescriptor {
  createdBy?: string; // Person or team who created the pipeline
  lastModified?: string; // Last modification date
  version?: string; // Version of the pipeline configuration
  repository?: string; // Associated repository
}

export interface BashScriptDescriptor extends BaseDescriptor {
  name: 'bash';
  scriptPath?: string; // Path to the Bash script
  inlineScript?: string; // Inline script content
  environmentVariables?: Record<string, string>; // Env vars to pass to the script
}

export const knownCiCds: CiCdDescriptor[] = [
  {
    cICdPipeline: {
      name: 'cd-api-ubuntu',
      type: 'dev-env-setup',
      stages: [
        {
          name: 'User Setup',
          tasks: [
            {
              name: 'Create devops user',
              type: 'script-inline',
              executor: 'bash',
              script:
                'if ! id "devops" &>/dev/null; then sudo useradd -m -s /bin/bash devops; echo "devops:#cdVault[\'devopsPassword\']" | sudo chpasswd; fi',
              status: 'pending',
              cdVault: [
                {
                  name: 'devopsPassword',
                  description: 'DevOps user password',
                  isEncrypted: true,
                  value: null, // The plain value is not stored for security
                  encryptedValue: null, // Encrypted representation of the password
                  encryptionMeta: {
                    name: 'default', // Identifier for the encryption configuration
                    algorithm: 'aes-256-cbc', // Encryption algorithm used
                    encoding: 'hex', // Encoding format used for storing the encrypted data
                    ivLength: 16, // Length of the initialization vector (IV)
                    iv: 'a1b2c3d4e5f6g7h8', // The IV used during encryption
                    keyDerivationMethod: 'PBKDF2', // Optional: Method used to derive the key
                    keySalt: 's0m3s4ltv4lu3', // Optional: Salt used for key derivation
                    encryptedAt: '2025-03-03T12:00:00Z', // Timestamp of encryption
                  },
                },
              ],
            },
            {
              name: 'Set up home directory',
              type: 'script-inline',
              executor: 'bash',
              script:
                'sudo cp -r /etc/skel/. /home/devops/ && sudo chown -R devops:devops /home/devops/',
              status: 'pending',
            },
            {
              name: 'Grant sudo access',
              type: 'script-file',
              executor: 'bash',
              scriptFile: '/src/devops-scripts/cd-api/grant_sudo_access.sh',
              status: 'pending',
            },
          ],
        },
        {
          name: 'System Dependencies',
          tasks: [
            {
              name: 'Update system',
              type: 'script-inline',
              executor: 'bash',
              script: 'sudo apt update && sudo apt upgrade -y',
              status: 'pending',
            },
            {
              name: 'Install required packages',
              type: 'script-inline',
              executor: 'bash',
              script: 'sudo apt install -y net-tools nodejs npm redis-server',
              status: 'pending',
            },
          ],
        },
        {
          name: 'Node.js & TypeScript',
          tasks: [
            {
              name: 'Install TypeScript globally',
              type: 'method',
              executor: 'cd-cli',
              className: 'CdCliUtils',
              methodName: 'exec',
              input: {
                cmds: ['npm install -g typescript'],
                options: { mode: 'sync' },
              },
              status: 'pending',
            },
          ],
        },
        {
          name: 'Clone & Setup cd-api',
          tasks: [
            {
              name: 'Clone cd-api repository',
              type: 'script-inline',
              executor: 'bash',
              script:
                'git clone https://github.com/corpdesk/cd-api.git /home/devops/cd-api',
              status: 'pending',
            },
            {
              name: 'Install cd-api dependencies',
              type: 'script-inline',
              executor: 'bash',
              script: 'cd /home/devops/cd-api && npm install',
              status: 'pending',
            },
          ],
        },
        {
          name: 'Start Services',
          tasks: [
            {
              name: 'Start Redis Server',
              type: 'script-inline',
              executor: 'bash',
              script: 'sudo systemctl start redis-server',
              status: 'pending',
            },
            {
              name: 'Start cd-api',
              type: 'script-inline',
              executor: 'bash',
              script: 'cd /home/devops/cd-api && npm run dev',
              status: 'pending',
            },
          ],
        },
      ],
    },
    cICdTriggers: {
      type: 'push',
      branchFilters: ['main'],
      conditions: { includeTags: true },
    },
    cICdEnvironment: {
      name: 'production',
      url: 'https://corpdesk.com',
      type: 'production',
      deploymentStrategy: 'rolling',
    },
  },
  {
    cICdPipeline: {
      name: 'Corpdesk CI/CD - Bash Deployment',
      type: 'deployment',
      stages: [
        {
          name: 'Deployment',
          description: 'Deploy Corpdesk using Bash scripts',
          tasks: [
            {
              name: 'Stop existing services',
              type: 'script-inline',
              executor: 'bash',
              status: 'pending',
            },
            {
              name: 'Pull latest code',
              type: 'script-inline',
              executor: 'bash',
              status: 'pending',
            },
            {
              name: 'Start services',
              type: 'script-inline',
              executor: 'bash',
              status: 'pending',
            },
          ],
        },
      ],
    },
    cICdTriggers: {
      type: 'push',
      branchFilters: ['main'],
      conditions: { includeTags: true },
    },
    cICdEnvironment: {
      name: 'production',
      url: 'https://corpdesk.com',
      type: 'production',
      deploymentStrategy: 'rolling',
    },
  },
];

export const defaultCiCd: CiCdDescriptor = {
  cICdPipeline: {
    name: 'Default CI/CD Pipeline',
    type: 'integration',
    stages: [
      {
        name: 'Build',
        description: 'Default build stage',
        tasks: [
          {
            name: 'Default Build Task',
            type: 'script-inline',
            executor: 'bash',
            status: 'pending',
          },
        ],
      },
    ],
  },
  cICdTriggers: {
    type: 'manual',
    conditions: { includeTags: false },
  },
  cICdEnvironment: {
    name: 'Default Environment',
    url: 'http://localhost',
    type: 'testing',
    deploymentStrategy: 'recreate',
  },
};

/**
 * The source should eventually be from databse (preferably redis)
 * For experiments, the data will be set at the model files.
 * @param names
 * @param cIcDs
 * @returns
 */
export function getCiCdByName(
  names: string[],
  cIcDs: CiCdDescriptor[],
): CiCdDescriptor {
  for (const name of names) {
    const found = cIcDs.find((ciCd) => ciCd.cICdPipeline?.name === name);
    if (found) return found;
  }
  return defaultCiCd;
}
