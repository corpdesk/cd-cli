import type {
  CliControlsDescriptor,
  ScalingDescriptor,
  SecurityDescriptor,
} from './/service-descriptor.model.js';
import type {
  OperatingSystemDescriptor,
  SystemResources,
} from './/workstations.model.js';
import type { BaseDescriptor } from './base-descriptor.model.js';

export interface ContainerManagerDescriptor extends BaseDescriptor {
  typeInfo: ContainerManagerTypeDescriptor; // Type and deployment info of the container manager
  platformCompatibility: OperatingSystemDescriptor; // Platform compatibility details
  scalingConfig: ScalingDescriptor; // Scaling configurations
  cliControls: CliControlsDescriptor; // CLI control details
  security: SecurityDescriptor; // Security features and compliance
  containerDetails?: ContainerDescriptor[]; // Details of managed containers
  features: ContainerManagementFeaturesDescriptor; // Additional container management features
}

// // Base Descriptor
// export interface BaseDescriptor {
//   name: string; // Name of the container manager
//   description?: string; // Optional description of the container manager
//   version?: string; // Version of the container manager
// }

// Container Manager Type Descriptor
export interface ContainerManagerTypeDescriptor extends BaseDescriptor {
  managerType:
    | 'docker'
    | 'kubernetes'
    | 'podman'
    | 'lxc'
    | 'ecs'
    | 'nomad'
    | 'other'; // Type of container manager
  supportedContainerTypes: ('linux' | 'windows' | 'macOS' | 'multi-platform')[]; // Supported container OS types
  deploymentMode: 'local' | 'cloud' | 'hybrid'; // Deployment mode
}

// Container Descriptor
export interface ContainerDescriptor extends BaseDescriptor {
  containerId: string;
  image: string;
  status?: 'running' | 'stopped' | 'paused' | 'unknown';
  allocatedResources: SystemResources; // Resources allocated to this container
  environmentVariables?: Record<string, string>;
}

// Container Management Features Descriptor
export interface ContainerManagementFeaturesDescriptor extends BaseDescriptor {
  supportsLogging: boolean; // Whether logging is supported
  supportsMonitoring: boolean; // Whether monitoring tools are integrated
  orchestrationSupport?: ('swarm' | 'helm' | 'operator-framework')[]; // Supported orchestration methods
  lifecycleHooks?: {
    preStart?: string; // Hook before starting a container
    postStop?: string; // Hook after stopping a container
  };
}
