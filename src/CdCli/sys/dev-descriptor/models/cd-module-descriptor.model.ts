import type { CdServiceDescriptor } from './/cd-service-descriptor.model.js';
import type { EnvironmentDescriptor } from './/environment.model.js';
import type { LanguageDescriptor } from './/language.model.js';
import type { CdModelDescriptor } from './cd-model-descriptor.model.js';
// import type {
//   // CdServiceDescriptor,
//   LicenseDescriptor,
// } from './/service-descriptor.model';
import type { BaseDescriptor } from './base-descriptor.model.js';
import type { CdControllerDescriptor } from './cd-controller-descriptor.model.js';
import type { CiCdDescriptor } from './cicd-descriptor.model.js';
import type {
  ContributorDescriptor,
  VersionControlDescriptor,
} from './version-control.model.js';
import { LicenseDescriptor } from './license.model.js';

export interface CdModuleDescriptor extends BaseDescriptor {
  name: string;
  cdModuleType: CdModuleTypeDescriptor; // Type of module, e.g., frontend, api, etc.
  description?: string;
  ctx: CdCtx;
  projectGuid?: string;
  parentProjectGuid?: string;
  language?: LanguageDescriptor; // getLanguageByName(name: string,languages: LanguageDescriptor[],)
  license?: LicenseDescriptor; // License details // getLicenseByName(name: string,licenses: LicenseDescriptor[],)
  contributors?: ContributorDescriptor; // Vendors, developers, and communities // getContributorsByNames(names: string[],contributors: ContributorDescriptor,)
  controllers: CdControllerDescriptor[]; // List of controllers
  models: CdModelDescriptor[]; // List of models
  services: CdServiceDescriptor[]; // List of services
  environment?: EnvironmentDescriptor; // Development environment settings
  productionEnvironment?: EnvironmentDescriptor; // Production environment settings
  cdCi?: CiCdDescriptor; // Continuous Integration/Continuous Delivery
  versionControl?: VersionControlDescriptor; // Version control details
}

export interface CdModuleTypeDescriptor {
  typeName:
    | 'cd-frontend'
    | 'cd-api'
    | 'cd-push-server'
    | 'cd-cli'
    | 'pwa'
    | 'mobile'
    | 'mechatronic'
    | 'desktop'
    | 'microservice'
    | 'vs-code-extension'
    | 'web-application'
    | 'web-component'
    | 'web-service'
    | 'web-component-library'
    | 'unknown';
}

export enum CdCtx {
  Sys = 'sys', // System module
  App = 'app', // Optional module
}

export interface PropertyDescriptor extends BaseDescriptor {
  name: string; // Name of the property
  type: string; // Type (e.g., 'string', 'number', 'boolean', 'CoopMemberService', etc.)
  visibility?: 'public' | 'private' | 'protected' | 'package-private' | 'unknown'; // Scope
  static?: boolean; // Is it a static property?
  readonly?: boolean; // Readonly status
  optional?: boolean; // Optional property
  defaultValue?: any; // Default value if any
  decorators?: string[]; // e.g. ['@Injectable()']
  description?: string; // Human-readable explanation
}

