import type { FunctionDescriptor } from './/function-descriptor.model.js';
import type { BaseDescriptor } from './base-descriptor.model.js';
import { ComponentDescriptor, ComponentType } from './component-descriptor.model.js';
import type { DependencyDescriptor } from './dependancy-descriptor.model.js';


export interface CdServiceDescriptor extends ComponentDescriptor {
  type: ComponentType.Service | ComponentType.ServiceType;
  parentController?: string; // Optional, if the service is associated with a specific controller
}
