import type { FunctionDescriptor } from './/function-descriptor.model.js';
import type { BaseDescriptor } from './base-descriptor.model.js';
import type { DependencyDescriptor } from './dependancy-descriptor.model.js';

export interface CdServiceDescriptor extends BaseDescriptor {
  name: string; // The name of the service
  module?: string; // The module to which this service belongs
  description?: string; // Brief explanation of the service's purpose
  parent?: string; // Parent service (if part of a hierarchical structure)
  dependencies?: DependencyDescriptor[]; // Other services or external systems this service depends on

  methods: FunctionDescriptor[];
}
