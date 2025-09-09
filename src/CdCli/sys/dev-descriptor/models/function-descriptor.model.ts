import { ICdRequest } from '../../base/i-base.js';
import { DependencyDescriptor } from '../index.js';
import type { BaseDescriptor } from './base-descriptor.model.js';

export interface FunctionDescriptor extends BaseDescriptor {
  name: string; // override the BaseDescriptor, which is optional
  scope: ScopeDescriptor; // Access level and static nature
  parameters?: ParameterDescriptor[]; // Function parameters
  output?: OutputDescriptor; // Return type and description
  typeInfo?: TypeInfoDescriptor; // Generic types information
  behavior?: BehaviorDescriptor; // Behavioral characteristics
  annotations?: AnnotationsDescriptor['annotations']; // Metadata or decorators
  apiInfo?: ApiInfoDescriptor; // API-related information
  documentation?: DocumentationDescriptor; // Documentation details
  miscellaneous?: MiscellaneousDescriptor; // Overloads and tags
  isDefault: boolean; // Indicates if the function is a default export
  assert?: ICdRequest; // Optional assertion for testing purposes
  dependancy?: DependencyDescriptor[]
}

// Scope Descriptor
export interface ScopeDescriptor extends BaseDescriptor {
  visibility:
    | 'public'
    | 'private'
    | 'protected'
    | 'package-private'
    | 'unknown'; // Access level
  static: boolean; // Indicates if the function is static
}

// Parameter Descriptor
export interface ParameterDescriptor extends BaseDescriptor {
  name: string; // Parameter name
  type: string; // Data type of the parameter
  optional?: boolean; // Indicates if the parameter is optional
  defaultValue?: any; // Default value of the parameter
}

// Output Descriptor
// export interface OutputDescriptor extends BaseDescriptor {
//   returnType: string; // Data type of the return value
//   description?: string; // Explanation of the return value
// }
export interface OutputDescriptor extends BaseDescriptor {
  returnType: string; // e.g., 'Observable<CdFxReturn<...>>'
  description?: string;
  observableInnerType?: string; // ✅ Optional: e.g., 'CdFxReturn<MyModel[]>'
}

// Type Information Descriptor
export interface TypeInfoDescriptor extends BaseDescriptor {
  genericTypes?: string[]; // List of generic types
}

// Behavior Descriptor
export interface BehaviorDescriptor extends BaseDescriptor {
  isPure: boolean; // If the function is pure
  isAsync: boolean; // If the function is asynchronous
  isStatic?: boolean; // If the function is static
  returnsPromise?: boolean; // If the function returns a Promise
  isObservable?: boolean; // If the function returns an Observable
  throws?: string[]; // List of exceptions or errors the function might throw
}

// Annotations Descriptor
export interface AnnotationsDescriptor extends BaseDescriptor {
  annotations?: string[]; // Metadata or decorators
}

// API Information Descriptor
export interface ApiInfoDescriptor extends BaseDescriptor {
  route?: string; // API route or URL path for this function
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'unknown'; // HTTP method
  callsService?: string; // Name of the service method this function calls
}

// Documentation Descriptor
export interface DocumentationDescriptor extends BaseDescriptor {
  examples?: string[]; // Usage examples
  notes?: string; // Additional notes or caveats
}

// Miscellaneous Descriptor
export interface MiscellaneousDescriptor extends BaseDescriptor {
  overload?: FunctionDescriptor[]; // List of alternative function signatures
  tags?: string[]; // Tags or categories
}
