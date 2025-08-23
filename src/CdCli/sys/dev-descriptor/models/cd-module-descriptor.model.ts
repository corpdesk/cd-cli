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
import { AppType } from './cd-app.model.js';

export interface CdModuleDescriptor extends BaseDescriptor {
  name: string;
  parentAppType?: AppType; // If module is part of a larger application, this indicates the parent application type
  appType?: AppType; // Modules are considered as applications in Corpdesk, In this case it is considered an application of cd-module
  cdModuleType: CdModuleTypeDescriptor; // Type of module, e.g., frontend, api, etc.
  description?: string;
  ctx: CdCtx;
  projectGuid?: string;
  parentProjectGuid?: string;
  language?: LanguageDescriptor; // getLanguageByName(name: string,languages: LanguageDescriptor[],)
  controllers: CdControllerDescriptor[]; // List of controllers
  models: CdModelDescriptor[]; // List of models
  services: CdServiceDescriptor[]; // List of services
  environments?: EnvironmentDescriptor[]; // Development environment settings
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

/**
 * Coprpdesk module are categorized by their context.
 * - CdCtx.Sys: System modules that are essential for the core functionality of Corpdesk.
 * - CdCtx.App: Optional modules that can be added to enhance or extend the capabilities of Corpdesk.
 * 
 * This enum helps in identifying the context of a module and applying appropriate configurations or operations based on its type.
 */
export enum CdCtx {
  Sys = 'sys', // System module
  App = 'app', // Optional module
}

/**
 * When performing automated operations, some configurations may be exempt from certain checks or validations.
 * This mapping defines which configurations are exempt based on the context.
 * - CdCtx.Sys: Exempt configurations for system-level operations.
 * - CdCtx.App: Exempt configurations for application-level operations.
 * 
 * Each context maps to an array of configuration names that are exempt.
 * This allows for flexibility in handling different contexts while maintaining a clear structure.
 */
export const deriveExemptConfig: Record<CdCtx, string[]> = {
  [CdCtx.Sys]: ['base'],
  [CdCtx.App]: ['app-config'],
};

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

