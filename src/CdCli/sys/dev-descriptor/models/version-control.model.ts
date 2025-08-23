import type { BaseServiceDescriptor, VendorDescriptor } from './service-descriptor.model.js';
// import type { ServiceDescriptor } from './app-descriptor.model';
import type { BaseDescriptor } from './base-descriptor.model.js';
// import type { ServiceDescriptor } from './service-provider.model';

// import type { VersionControlDescriptor } from './dev-descriptor.model';
import { execSync } from 'node:child_process';
import {
  envCdApi,
  envCdApiApp,
  envCdApiSys,
  EnvironmentDescriptor,
  envTestBed,
  envWorkshop,
} from './environment.model.js';
import { AppType, CdAppDescriptor, CICdHistory, CICdPipeline, CICdTask } from '../index.js';
// Example Usage

/**
 * const descriptor = getVersionControlDescriptor('.');
    console.log(descriptor);
 */

// Main VersionControlDescriptor Interface
export interface VersionControlDescriptor extends BaseDescriptor {
  patchLevel?: number; // serialized patch number for the version data
  repository: RepoDescriptor; // Repository details
  versionControlBranch?: VersionControlBranch; // Branch details
  devRoadmap?: CICdPipeline; // Roadmap/Workflow process
  devChangeLog?: CICdHistory; // Change log entries
  sourceContributors?: SourceContributor[]; // List of contributors
  versionControlTags?: VersionControlTag[]; // List of tags
  versionControlMetadata?: VersionControlMetadata; // Metadata information
}

// Interface for Tags
// export interface VersionControlTag extends BaseDescriptor {
//   name: string; // Tag name (e.g., "v1.0.0")
//   commitHash?: string; // Hash of the commit the tag points to
//   description?: string; // Description of the tag
//   date?: string; // Date of tagging
// }

export interface VersionControlTag extends BaseDescriptor {
  name: string; // e.g., "v1.2.3"
  commitHash?: string;
  description?: string;
  date?: string;
  roadmapRef?: string; // CICdPipeline.id
  milestoneRef?: string; // CICdStage.id
}

// Updated SemanticVersionMap for flexible parsing and introspection
export interface SemanticVersionMap {
  version: string; // e.g., "1.2.3-beta"
  roadmapId: string; // maps to CICdPipeline
  milestoneId: string; // maps to CICdStage
  versionObject?: SemanticVersionObject; // optional structured interpretation
}

// New structured representation of a semantic version
export interface SemanticVersionObject {
  major: number;
  minor: number;
  patch?: number;
  label?: string; // e.g., 'alpha', 'beta', 'rc', etc.
}

export interface VersionParts {
  versionString: string;
  roadmap: string;
  milestone: string;
  patchLevel: string;
  pipelineStage: string;
  tagComponents: string[];
}

// Interface for Metadata
export interface VersionControlMetadata extends BaseDescriptor {
  creationDate?: string; // Date the repository was created
  lastUpdated?: string; // Date of the last update
  license?: string; // License of the repository (e.g., "MIT")
  repositorySize?: string; // Human-readable size of the repository (e.g., "20 MB")
  language?: string; // Primary programming language of the repository
}

export interface RepoDescriptor extends BaseDescriptor {
  name: string;
  description?: string;
  url: string;
  type: 'git' | 'svn' | 'mercurial' | 'other';
  appType?: AppType;
  enabled?: boolean;
  isPrivate?: boolean;
  remote?: string;
  service?: BaseServiceDescriptor;
  directories?: RepoDirectoryDescriptor[]; // List of directories associated with the repository
  credentials: RepoCredentials;
}

// Interface for repository directory. Multiples can be used to describe different directories of different contextual usage in the repository.
export interface RepoDirectoryDescriptor {
  // context: 'workshop' | 'test-bed' | 'production' | 'ci-cd' | 'custom'; // known use-case types
  name?: string; // Name of the directory (e.g., "src", "dist", "output")
  environment: EnvironmentDescriptor; // Environment context (e.g., workshop, test-bed)
  path: string; // absolute or relative path
  purpose?: string; // optional human-readable explanation
  isDefault?: boolean; // helpful when one is "primary"
}

export interface RepoCredentials extends BaseDescriptor {
  repoHost: string; // Organization hosting a repository (e.g., georemo, corpdesk")
  password?: string;
  accessToken?: string;
}

// Interface for Branch
export interface VersionControlBranch extends BaseDescriptor {
  name: string; // Name of the branch (e.g., "main", "develop")
  type: 'main' | 'feature' | 'hotfix' | 'release' | 'custom'; // Type of branch
  lastCommit?: VersionControlCommit; // Details of the last commit
  protection?: BranchProtectionRules; // Branch protection details
}

// Interface for Workflow
// export interface VersionControlWorkflow extends BaseDescriptor {
//   strategy: 'trunk-based' | 'gitflow' | 'forking' | 'other'; // Version control workflow strategy
//   mergeMethod: 'merge' | 'rebase' | 'squash'; // Preferred merge method
//   policies?: WorkflowPolicies; // Workflow policies
//   roadmap?: CICdPipeline
// }

// Interface for Contributors
export interface SourceContributor extends BaseDescriptor {
  name: string; // Contributor's name
  email: string; // Contributor's email
  role: 'owner' | 'maintainer' | 'contributor' | 'reviewer'; // Role in the repository
}

// Interface for Commit
export interface VersionControlCommit extends BaseDescriptor {
  hash: string; // Commit hash (e.g., "abc123")
  author: string; // Author of the commit
  date: string; // Date of the commit
  message: string; // Commit message
}

// Interface for Branch Protection Rules
export interface BranchProtectionRules extends BaseDescriptor {
  isProtected: boolean; // Whether the branch is protected
  rules?: string[]; // Protection rules (e.g., "require pull request")
}

// Interface for Workflow Policies
export interface WorkflowPolicies extends BaseDescriptor {
  reviewRequired: boolean; // Whether reviews are mandatory for merging
  ciChecksRequired: boolean; // Whether CI checks are required
}

export interface DeveloperDescriptor extends BaseDescriptor {
  name: string; // Developer or group name
  role?: string; // Role in the project (e.g., 'Lead Developer', 'Contributor')
  contact?: string; // Email or contact link
  profileLink?: string; // Link to personal or group profile (e.g., GitHub)
}

export interface ContributorDescriptor extends BaseDescriptor {
  vendor?: VendorDescriptor;
  developers?: DeveloperDescriptor[];
  communities?: CommunityDescriptor[];
}

export interface CommunityDescriptor extends BaseDescriptor {
  name: string; // Community name
  type: 'forum' | 'github' | 'mailingList' | 'other';
  link: string; // URL to the community
}

// export interface ChangeLogDescriptor extends BaseDescriptor {
//   version: string;
//   date: string;
//   author: string;
//   changes: ChangeLogItem[];
// }

// export interface ChangeLogItem {
//   type: 'added' | 'fixed' | 'changed' | 'deprecated' | 'removed';
//   description: string;
//   tagRef?: string; // optional Git tag
//   file?: string; // affected file
// }

// export interface DocumentationDescriptor extends BaseDescriptor {
//   version: string;
//   url?: string; // link to external doc
//   path?: string; // path in repo
//   status: 'draft' | 'stable' | 'archived';
//   summary?: string;
//   updatedOn?: string;
// }

export interface CdDocDescriptor extends BaseDescriptor {
  version: string;
  url?: string; // External doc link (e.g., GitBook)
  path?: string; // Relative path to markdown file or doc file
  status: 'draft' | 'stable' | 'archived';
  summary?: string;

  targetApp?: CdAppDescriptor; // The app or project this doc describes
  linkedPipeline?: CICdPipeline; // Optional: CICD context this doc belongs to

  fileMeta?: CdFileDescriptor; // Standardized metadata (createdAt, updatedBy, etc.)
}

// export interface CdFileDescriptor {
//   createdAt?: string; // ISO timestamp
//   lastUpdated?: string; // ISO timestamp
//   createdBy?: string; // Optional: identifier of creator (username, tool, etc.)
//   updatedBy?: string; // Optional: identifier of last modifier
//   version?: string; // Optional: semantic version of the data in the file
//   origin?: string; // Optional: what tool or process created this file
// }
export interface CdFileDescriptor {
  createdAt?: string; // ISO timestamp (e.g., "2025-07-29T15:30:25.651Z")
  lastUpdated?: string; // ISO timestamp
  createdBy?: string; // Optional: username, tool, or agent that created the file
  updatedBy?: string; // Optional: username, tool, or agent that last modified the file
  version?: string; // Optional: semantic version (e.g., "1.0.0")
  origin?: string; // Optional: source tool or service (e.g., "cd-cli", "cd-doc-bot")
}

export interface CdFileWrapper<T> {
  descriptor: T;
  fileMeta: CdFileDescriptor;
}

export const repoRegistry: VersionControlDescriptor[] = [
  {
    name: 'cd-ai',
    repository: {
      name: 'cd-ai',
      appType: AppType.CdApiModule,
      url: 'https://github.com/corpdesk/cd-ai.git',
      type: 'git',
      enabled: true,
      isPrivate: false,
      credentials: {
        repoHost: 'corpdesk',
      },
      directories: [
        /**
         * This is the workshop output directory associated with this particular version controller descriptor.
         * It is used to scafold the module for the cd-ai.
         */
        {
          name: 'workshopModuleOutput',
          environment: envWorkshop,
          path: '/home/emp-12/cd-cli/dist/CdCli/app/app-craft/workshop/cd-module/output/cd-ai',
          purpose: 'Auto-generated source files',
          isDefault: true,
        },
        /**
         * This is the test-bed for this scafold module.
         * The module is first generated in the workshop output directory,
         * then synced with the git repository.
         * It is then used for integration and live testing.
         * The test-bed is used to test the module in a live environment.
         */
        {
          name: 'moduleTestBed',
          environment: envTestBed,
          path: '/home/emp-12/cd-projects/cd-api/src/CdApi/app/cd-ai',
          purpose: 'Integration and live testing',
        },
        /**
         * This is the app directory for the test-bed, cd-api.
         */
        {
          name: 'testBedApiApp',
          environment: envCdApiApp,
          path: '/home/emp-12/cd-projects/cd-api/src/CdApi/app',
          purpose: 'cd-api apps directory',
        },
        /**
         * This is the sys directory for the test-bed, cd-api.
         */
        {
          name: 'testBedApiSys',
          environment: envCdApiSys,
          path: '/home/emp-12/cd-projects/cd-api/src/CdApi/sys',
          purpose: 'cd-api system directory',
        },
        /**
         * This is the root directory for the test-bed, cd-api.
         * It is used to derive the app descriptor path for the cd-api.
         */
        {
          name: 'testBedApiRoot',
          environment: envCdApi,
          path: '/home/emp-12/cd-projects/cd-api',
          purpose: 'cd-api root directory',
        },
        /**
         * This is the app descriptor for this particular version controller descriptor.
         * In this case it is the cd-api root directory.
         * It is used to derive the app descriptor path for the cd-api.
         */
        {
          name: 'CdAppDescriptor',
          environment: envCdApi,
          path: '/home/emp-12/cd-projects/cd-api/.cd/cd-app.descriptor.json',
          purpose: 'cd-api root directory',
        },
      ],
    },
  },
  {
    repository: {
      name: 'cd-cli',
      description: 'Node.js CLI for Corpdesk',
      url: 'https://github.com/corpdesk/cd-cli-nodejs/',
      type: 'git',
      enabled: true,
      isPrivate: false,
      credentials: {
        repoHost: 'github.com',
      },
    },
    context: ['cd-cli'],
    versionControlBranch: {
      name: 'main',
      type: 'main',
    },
    // devRoadmap: {
    //   strategy: 'trunk-based',
    //   mergeMethod: 'merge',
    // },
    sourceContributors: [
      {
        name: 'George Oremo',
        email: 'george.oremo@gmail.com',
        role: 'owner',
      },
    ],
  },
  {
    name: 'cd-api',
    repository: {
      name: 'cd-api',
      appType: AppType.CdApi,
      url: 'https://github.com/corpdesk/cd-api.git',
      type: 'git',
      enabled: true,
      isPrivate: false,
      credentials: {
        repoHost: 'corpdesk',
      },
      directories: [
        {
          environment: envTestBed,
          path: '/home/emp-12/cd-projects/cd-api',
          purpose: 'Integration and live testing',
        },
        {
          environment: envCdApiApp,
          path: '/home/emp-12/cd-projects/cd-api/src/CdApi/app',
          purpose: 'cd-api apps directory',
        },
        {
          environment: envCdApiSys,
          path: '/home/emp-12/cd-projects/cd-api/src/CdApi/sys',
          purpose: 'cd-api system directory',
        },
        {
          environment: envCdApi,
          path: '/home/emp-12/cd-projects/cd-api',
          purpose: 'cd-api root directory',
        },
      ],
    },
  },
  {
    repository: {
      name: 'cd-shell',
      description: 'Angular module federation shell for Corpdesk frontend',
      url: 'https://github.com/corpdesk/cd-shell/',
      type: 'git',
      enabled: true,
      isPrivate: false,
      credentials: {
        repoHost: 'github.com',
      },
    },
    context: ['cd-frontend', 'cd-shell'],
    versionControlBranch: {
      name: 'main',
      type: 'main',
    },
  },
  {
    repository: {
      name: 'cd-user',
      description: 'Angular module federation remote module for user',
      url: 'https://github.com/corpdesk/cd-user/',
      type: 'git',
      enabled: true,
      isPrivate: false,
      credentials: {
        repoHost: 'github.com',
      },
    },
    context: ['cd-frontend', 'cd-user'],
    versionControlBranch: {
      name: 'main',
      type: 'main',
    },
  },
];

// Function to get a repository by name
export function getVersionControlByName(
  name: string,
  repositories: VersionControlDescriptor[],
): VersionControlDescriptor | undefined {
  return repositories.find((repo) => repo.repository.name === name);
}

// Function to get repositories by context
export function getVersionControlByContext(
  context: string,
  repositories: VersionControlDescriptor[],
): VersionControlDescriptor[] {
  return repositories.filter((repo) => repo.context?.includes(context) ?? false);
}
