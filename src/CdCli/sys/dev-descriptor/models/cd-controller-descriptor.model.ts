import type { FunctionDescriptor } from './/function-descriptor.model.js';
import type { BaseDescriptor } from './base-descriptor.model.js';
import { ComponentDescriptor, ComponentType } from './component-descriptor.model.js';
import type { DependencyDescriptor } from './dependancy-descriptor.model.js';
import { ViewModelDescriptor } from './view-model-descriptor.model.js';

// export interface CdControllerDescriptor extends BaseDescriptor {
//   name: string; // The name of the controller
//   module?: string; // The module to which this controller belongs
//   description?: string; // Brief explanation of the controller's purpose
//   parent?: string; // Parent controller (if part of a hierarchical structure)
//   dependencies?: DependencyDescriptor[]; // Other controllers or services this controller depends on
//   actions: FunctionDescriptor[]; // Array of actions represented as FunctionDescriptors
//   properties?: Record<string, any>; // Additional properties for the controller
//   view?: ViewModelDescriptor; // View model descriptor for the controller
// }

export interface CdControllerDescriptor extends ComponentDescriptor {
  type: ComponentType.Controller | ComponentType.ControllerType;
}
