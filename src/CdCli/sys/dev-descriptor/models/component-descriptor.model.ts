import { BaseDescriptor } from './base-descriptor.model.js';
import { DependencyDescriptor } from './dependancy-descriptor.model.js';
import { FunctionDescriptor } from './function-descriptor.model.js';
import { ViewModelDescriptor } from './view-model-descriptor.model.js';

export interface ComponentDescriptor extends BaseDescriptor {
  name: string;
  //   type: 'controller' | 'service' | 'model' | 'utility' | 'component' | 'plugin'; // Extendable
  type: ComponentType;
  module?: string;
  parent?: string;
  fileName?: string; // File name where the component is defined
  attributes?: ComponentAttributes[];
  methods?: FunctionDescriptor[];
  classSignature?: ClassSignatureDescriptor;
  dependencies?: DependencyDescriptor[]; // Shared across components
  traits?: string[]; // Optional semantic tags, e.g., ['singleton', 'stateless']
  view?: ViewModelDescriptor; // Optional, for controller-UI interaction
}

// Discriminated Component Types
export enum ComponentType {
  Controller = 'controller',
  ControllerType = 'controller-type',
  Service = 'service',
  ServiceType = 'service-type',
  Model = 'model',
  ModelType = 'model-type',
  ModelView = 'model-view',
  Utility = 'utility',
  Component = 'component',
  Plugin = 'plugin',
}

export type PrimaryComponentType = 'controller' | 'service' | 'model';
export type DerivedSuffix = 'type' | 'view';

export type DerivedComponentType =
  | `${PrimaryComponentType}-${DerivedSuffix}`;

export type Ext = 'controller' | 'service' | 'model';
export type Suffix = 'type' | 'view' | null;

// export type ComponentType =
//   | PrimaryComponentType
//   | DerivedComponentType;

// export enum ComponentType {
//   CONTROLLER = 'controller',
//   CONTROLLER_TYPE = 'controller-type',
//   SERVICE = 'service',
//   SERVICE_TYPE = 'service-type',
//   MODEL = 'model',
//   MODEL_TYPE = 'model-type',
//   MODEL_VIEW = 'model-view',
//   UTILITY = 'utility',
//   COMPONENT = 'component',
//   PLUGIN = 'plugin',
//   VIEW = 'view', // new addition
//   VIEW_TYPE = 'view-type', // for symmetry with type
// }

// --- Attributes Definition ---

export interface ComponentAttributes extends BaseDescriptor, PropertyDescriptor {
  // Applicable to all
  tags?: string[];
  custom?: Record<string, any>;

  // Controller-specific
  isApiEntry?: boolean;
  httpContextAware?: boolean;
  routing?: RouteBindingDescriptor;
  view?: ViewModelDescriptor;

  // Service-specific
  singleton?: boolean;
  lifecycle?: 'singleton' | 'scoped' | 'transient' | 'request'; // Lifecycle management
  domain?: string;

  isDependency?: boolean; // Whether it’s injected
  isConfiguration?: boolean; // Whether it's config (e.g., from env)
  isStateful?: boolean; // Whether it holds state
  isDefault?: boolean; // Whether it’s the default implementation
  scope?: 'local' | 'module' | 'global'; // architectural scope
  visibility?: 'public' | 'private' | 'protected' | 'package-private'; // ✅ For code-level access

  value?: any; // The actual value of the property
  defaultValue?: any; // Default value if applicable
}

// Placeholder for route binding definition
export interface RouteBindingDescriptor {
  baseRoute?: string;
  routePrefix?: string;
  authRequired?: boolean;
  methods?: {
    [methodName: string]: {
      httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      route: string;
    };
  };
}

export interface ClassSignatureDescriptor {
  extends?: string;
  implements?: string[];
  decorators?: DecoratorDescriptor[];
}

export interface DecoratorDescriptor {
  name: string; // Name of the decorator, e.g., "Injectable", "CustomDecorator"
  arguments?: any[]; // Positional arguments if applicable
  namedArguments?: Record<string, any>; // For object-like decorators (named config)
  raw?: string; // Optional: Full string fallback for non-structured decorators
}
