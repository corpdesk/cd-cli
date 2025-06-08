import type {
  BaseServiceDescriptor,
  VendorDescriptor,
} from './service-descriptor.model.js';
// import type { ServiceDescriptor } from './app-descriptor.model';
import type { BaseDescriptor } from './base-descriptor.model.js';
// import type { ServiceDescriptor } from './service-provider.model';

// import type { VersionControlDescriptor } from './dev-descriptor.model';
import { execSync } from 'node:child_process';
// Example Usage

/**
 * const descriptor = getVersionControlDescriptor('.');
    console.log(descriptor);
 */

// Interface for Tags
export interface VersionControlTag extends BaseDescriptor {
  name: string; // Tag name (e.g., "v1.0.0")
  commitHash?: string; // Hash of the commit the tag points to
  description?: string; // Description of the tag
  date?: string; // Date of tagging
}

// Interface for Metadata
export interface VersionControlMetadata extends BaseDescriptor {
  creationDate?: string; // Date the repository was created
  lastUpdated?: string; // Date of the last update
  license?: string; // License of the repository (e.g., "MIT")
  repositorySize?: string; // Human-readable size of the repository (e.g., "20 MB")
  language?: string; // Primary programming language of the repository
}

// Main VersionControlDescriptor Interface
export interface VersionControlDescriptor extends BaseDescriptor {
  repository: RepoDescriptor; // Repository details
  versionControlBranch?: VersionControlBranch; // Branch details
  versionControlWorkflow?: VersionControlWorkflow; // Workflow details
  sourceContributors?: SourceContributor[]; // List of contributors
  versionControlTags?: VersionControlTag[]; // List of tags
  versionControlMetadata?: VersionControlMetadata; // Metadata information
}

export interface RepoDescriptor extends BaseDescriptor {
  name: string;
  description?: string;
  url: string;
  type: 'git' | 'svn' | 'mercurial' | 'other';
  enabled?: boolean;
  isPrivate?: boolean;
  remote?: string;
  service?: BaseServiceDescriptor;
  directory?: string; // NEW: Local directory where the repo should be cloned
  credentials: RepoCredentials;
}

export interface RepoCredentials extends BaseDescriptor {
  repoHost: string;
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
export interface VersionControlWorkflow extends BaseDescriptor {
  strategy: 'trunk-based' | 'gitflow' | 'forking' | 'other'; // Version control workflow strategy
  mergeMethod: 'merge' | 'rebase' | 'squash'; // Preferred merge method
  policies?: WorkflowPolicies; // Workflow policies
}

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

// export interface RepoDescriptor extends BaseDescriptor {
//   name: string;
//   description?: string;
//   url: string;
//   type: 'git' | 'svn' | 'mercurial' | 'other';
//   enabled?: boolean;
//   isPrivate?: boolean;
//   remote?: string;
//   service?: BaseServiceDescriptor;
//   directory?: string; // NEW: Local directory where the repo should be cloned
//   credentials: RepoCredentials;
// }

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

export const versionControlRepositories: VersionControlDescriptor[] = [
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
    versionControlWorkflow: {
      strategy: 'trunk-based',
      mergeMethod: 'merge',
    },
    sourceContributors: [
      {
        name: 'George Oremo',
        email: 'george.oremo@gmail.com',
        role: 'owner',
      },
    ],
  },
  {
    repository: {
      name: 'cd-api',
      description: 'Node.js backend for Corpdesk',
      url: 'https://github.com/corpdesk/cd-api/',
      type: 'git',
      enabled: true,
      isPrivate: false,
      credentials: {
        repoHost: 'github.com',
      },
    },
    context: ['cd-api', 'cd-api-dev-env'],
    versionControlBranch: {
      name: 'main',
      type: 'main',
    },
    versionControlWorkflow: {
      strategy: 'trunk-based',
      mergeMethod: 'merge',
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
  return repositories.filter(
    (repo) => repo.context?.includes(context) ?? false,
  );
}
