// import type { DependencyDescriptor } from './app-descriptor.model';

import type { ContainerManagerDescriptor } from '../../dev-descriptor/models/container-manager.model.descriptor.js';
import type { DataStoreDescriptor } from '../../dev-descriptor/models/datastore-descriptor.model.js';
import type { BaseDescriptor } from './base-descriptor.model.js';
import type {
  AccountCredentials,
  ProviderInstruction,
  ServiceProviderDescriptor,
  UsageMetrics,
} from './service-provider.model.js';
import {
  type DNSRecord,
  type FileStorageAccess,
  type FileStorageCapacity,
  type FileStorageLocation,
  type FileStoreDescriptor,
  type FirewallRule,
  getWorkstationByName,
  type NetworkInterfaceDescriptor,
  type OperatingSystemDescriptor,
  type OperatingSystemPermissionDescriptor,
  type PortMapping,
  type VolumeMapping,
  type WorkstationAccessDescriptor,
} from './workstations.model.js';

export interface BaseServiceDescriptor extends BaseDescriptor {
  serviceName: string;
  serviceType:
    | 'storage'
    | 'compute'
    | 'push-services'
    | 'database'
    | 'networking'
    | 'repository'
    | 'api'
    | 'gui-web-app'
    | 'push-server'
    | 'static-site'
    | 'background-process'
    | 'daemon'
    | 'cron-job'
    | 'worker-thread'
    | 'other' // Covers all service types
    | 'unknown';

  command: string; // Execution command
  workstationAccess: WorkstationAccessDescriptor;

  credentials?: AccountCredentials; // Access credentials for the service
  usageMetrics?: UsageMetrics; // Service-related performance metrics
  configuration?: Record<string, any>; // Service-specific settings
  availabilityZones?: string[]; // Regions where the service operates
  serviceProvider?: ServiceProviderDescriptor; // Provider details

  metadata?: {
    description?: string;
    createdBy?: string;
    createdAt?: string;
  };
}

// export interface ServiceDescriptor {
//   serviceName: string; // Name of the service (e.g., S3, Compute Engine, Blob Storage)
//   serviceType:
//     | 'storage'
//     | 'compute'
//     | 'push-services'
//     | 'database'
//     | 'networking'
//     | 'repository'
//     | 'other'; // Type of service
//   credentials?: AccountCredentials; // Specific credentials to access this service
//   usageMetrics?: UsageMetrics; // Metrics like quota, consumption, or performance
//   configuration?: Record<string, any>; // Service-specific configuration details
//   availabilityZones?: string[]; // Regions or zones where the service is available
//   serviceProvider?: ServiceProviderDescriptor;
// }

export interface CloudServiceDescriptor extends BaseServiceDescriptor {
  provider:
    | 'aws'
    | 'google-cloud'
    | 'azure'
    | 'digitalocean'
    | 'custom'
    | 'unknown';

  webServerEnvironment: 'development' | 'staging' | 'production' | 'unknown';
  webServer: WebServer;
  sslConfig: SslConfig;
  domainConfig: DomainConfig;
  osHost: OperatingSystemDescriptor;

  directories: {
    fileStorageCapacity: FileStorageCapacity;
    fileStorageLocation: FileStorageLocation;
    fileStorageAccess: FileStorageAccess;
  };

  network: NetworkInterfaceDescriptor;
  containerManager?: ContainerManagerDescriptor;
  webServerSecurity: WebserverSecurityConfig;
}

export interface SystemServiceDescriptor extends BaseServiceDescriptor {
  serviceType:
    | 'background-process'
    | 'daemon'
    | 'cron-job'
    | 'worker-thread'
    | 'storage'
    | 'unknown';
  osServiceManager:
    | 'systemd'
    | 'initd'
    | 'supervisor'
    | 'custom'
    | 'unknown'
    | 'unknown';
  dependencies?: string[]; // Other required system services
  restartPolicy?: 'always' | 'on-failure' | 'manual' | 'unknown';
  networkConfig?: NetworkInterfaceDescriptor[];
}

export interface WebserverSecurityConfig {
  htaccess?: string; // Content of .htaccess or equivalent security file
  headers?: Record<string, string>; // HTTP security headers
  firewall?: FirewallRule[];
}

export interface DomainConfig {
  primaryDomain: string; // Primary domain for the web service
  subdomains?: string[]; // List of subdomains to create
  dnsSettings: DNSRecord[];
}

export interface WebServer extends BaseDescriptor {
  provider: 'nginx' | 'apache' | 'iis' | 'custom' | 'unknown'; // Web server type
  config: string; // Path or raw content of server configuration (e.g., nginx.conf)
}

export interface SslConfig extends BaseDescriptor {
  enabled: boolean; // Whether SSL is enabled
  provider: 'letsencrypt' | 'custom' | 'unknown'; // SSL provider
  certificatePath?: string; // Path to SSL certificate (if custom)
  privateKeyPath?: string; // Path to private key (if custom)
  autoRenew?: boolean; // Whether SSL should auto-renew
}

// Scaling Configuration Descriptor
export interface ScalingDescriptor extends BaseDescriptor {
  autoScaling: boolean; // Whether auto-scaling is supported
  scalingStrategies?: ('horizontal' | 'vertical' | 'cluster' | 'node-pool')[]; // Supported scaling strategies
  maxContainers?: number; // Maximum number of containers supported
  resourceLimits?: {
    cpu: string; // CPU limit per container (e.g., "4 cores")
    memory: string; // Memory limit per container (e.g., "8GB")
  };
}

export interface WebserviceProvisionDescriptor extends CloudServiceDescriptor {
  accountAccess: {
    method: 'api-key' | 'oauth' | 'ssh-key' | 'username-password' | 'unknown'; // Authentication method
    credentials: AccountCredentials; // Encapsulated account credentials
  };

  provisioningTools: {
    tool:
      | 'terraform'
      | 'ansible'
      | 'cloudformation'
      | 'pulumi'
      | 'custom-script'
      | 'unknown'; // Tool for provisioning
    version?: string; // Version of the tool (optional)
    configuration: string; // Path or inline configuration for the tool
  }[];

  scriptingSupport?: {
    enabled: boolean; // Whether custom scripting is allowed
    language: 'bash' | 'python' | 'typescript' | 'other' | 'unknown'; // Scripting language
    scripts: ScriptDescriptor[]; // List of available or custom scripts
  };

  migration: {
    enabled: boolean; // Whether migration is supported
    sourceProvider:
      | 'aws'
      | 'google-cloud'
      | 'azure'
      | 'digitalocean'
      | 'custom'
      | 'unknown'; // Current provider
    targetProvider:
      | 'aws'
      | 'google-cloud'
      | 'azure'
      | 'digitalocean'
      | 'custom'
      | 'unknown'; // Target provider
    steps: MigrationStep[]; // Steps to facilitate migration
    rollback?: boolean; // Whether rollback options are provided
  };

  // providerSpecificInstructions?: Record<string, ProviderInstruction>; // Instructions for specific providers
}

export interface ScriptDescriptor extends BaseDescriptor {
  name: string; // Name of the script
  description: string; // Description of what the script does
  script: string; // Inline script content or path to the script file
}

export interface MigrationStep extends BaseDescriptor {
  description: string; // Description of the migration step
  command: string; // Command or action to perform during migration
  tools?: string[]; // Tools required to perform the step (optional)
}

// export interface LicenseDescriptor extends BaseDescriptor {
//   type: 'openSource' | 'commercial' | 'custom';
//   licenseName?: string; // For standard licenses (e.g., 'MIT', 'GPL-3.0', 'Apache-2.0')
//   licenseLink?: string; // URL to the license text (for commercial or open source)
//   terms?: string; // For custom licenses or additional terms
//   cost?: {
//     type: 'free' | 'paid';
//     amount?: number; // Specify cost if 'paid'
//     currency?: string; // Currency type if 'paid'
//   };
// }

export interface VendorDescriptor extends BaseDescriptor {
  name: string; // Name of the vendor or organization
  contact?: string; // Email or contact link
  website?: string; // Website URL
}

// CLI Controls Descriptor
export interface CliControlsDescriptor extends BaseDescriptor {
  supportsCli: boolean; // Whether CLI controls are available
  cliCommands?: string[]; // List of supported CLI commands (e.g., ["docker run", "kubectl apply"])
  customScripting?: boolean; // Whether custom scripting is supported
}

// Security Descriptor
export interface SecurityDescriptor extends BaseDescriptor {
  isSecure: boolean; // Indicates if the manager has built-in security features
  features?: (
    | 'isolation'
    | 'encryption'
    | 'role-based-access-control'
    | 'audit-logs'
    | 'unknown'
  )[]; // Supported security features
  vulnerabilities?: string[];
  complianceStandards?: string[]; // Supported compliance standards (e.g., ["CIS", "PCI DSS", "HIPAA"])
}

export interface UtilityConfig extends BaseDescriptor {
  loadBalancer?: {
    enabled: boolean; // Whether load balancer is enabled
    type?: string; // Load balancer type (e.g., nginx)
  };
  dataStore?: DataStoreDescriptor[];
  fileStore?: FileStoreDescriptor[];
  webService?: CloudServiceDescriptor;
  containerManager?: {
    type: string; // Container manager type (e.g., docker)
    composeFile?: string; // Path to the compose file
  };
  cloudVisualizer?: {
    enabled: boolean; // Whether cloud visualizer is enabled
    tool?: string; // Visualizer tool name (e.g., Cloud-Brix)
  };
  diagnosticTool?: {
    enabled: boolean; // Whether diagnostic tools are enabled
    commands?: string[]; // List of diagnostic commands
  };
}

export interface ServiceCost extends BaseDescriptor {
  type: 'free' | 'paid' | 'unknown';
  amount?: number; // Specify cost if 'paid'
  currency?: string; // Currency type if 'paid'
  costRate?:
    | 'once'
    | 'per-month'
    | 'per-quarter'
    | 'per-year'
    | 'per-user'
    | 'unknown';
}

/**
 * cd-api Services:
    ----------------
    apache
    nginx
    mysql
    redis
    cd-api system service
    cd-sio system service
    ssh-server
 */
// export const services: SystemServiceDescriptor[] = [
//   {
//     serviceName: 'redis',
//     context: ['cd-api', 'cd-api-dev-env', 'cd-cli'],
//     serviceType: 'storage',
//     osServiceManager: 'systemd',
//     command: 'sudo service redis-server start', // Execution command
//     workstationAccess: {
//       accessScope: 'local',
//       physicalAccess: 'direct',
//       interactionType: 'cli',
//     },
//     /**
//      *  # bind 192.168.1.100 10.0.0.1     # listens on two specific IPv4 addresses
//         # bind 127.0.0.1 ::1              # listens on loopback IPv4 and IPv6
//         # bind * -::*                     # like the default, all available interfaces

//         # Accept connections on the specified port, default is 6379 (IANA #815344).
//         # If port 0 is specified Redis will not listen on a TCP socket.
//         port 6379
//      */
//     // configuration?: Record<string, any>; // Service-specific settings
//   },
//   {
//     serviceName: 'mysql',
//     context: ['cd-api', 'cd-api-dev-env'],
//     serviceType: 'storage',
//     osServiceManager: 'systemd',
//     command: 'sudo service mysql start', // Execution command
//     workstationAccess: {
//       accessScope: 'local',
//       physicalAccess: 'direct',
//       interactionType: 'cli',
//     },
//     /**
//      *  port = 3306
//         # localhost which is more compatible and is not less secure.
//         bind-address            = 0.0.0.0
//      */
//     // configuration?: Record<string, any>; // Service-specific settings
//   },
// ];

// export interface PortMapping extends BaseDescriptor {
//   containerPort: number; // Port inside the container/application
//   hostPort?: number; // Port exposed on the host
//   protocol: 'TCP' | 'UDP' | 'unknown'; // Protocol type
//   ingress?: IngressConfig; // Ingress rules for this port
//   egress?: EgressConfig; // Egress rules for this port
// }
export const services: SystemServiceDescriptor[] = [
  {
    serviceName: 'redis',
    context: ['cd-api', 'cd-api-dev-env', 'cd-cli'],
    serviceType: 'storage',
    osServiceManager: 'systemd',
    command: 'sudo service redis-server start', // Execution command
    workstationAccess: {
      accessScope: 'local',
      physicalAccess: 'direct',
      interactionType: 'cli',
    },
    networkConfig: [
      {
        name: 'Redis Localhost',
        context: ['cd-api', 'cd-api-dev-env', 'cd-cli'],
        hostname: 'localhost',
        ip4Addresses: ['127.0.0.1'],
        servicePorts: {
          portMapping: [{ port: 6379, protocol: 'TCP' }],
        },
      },
      {
        name: 'Redis External',
        context: ['cd-api', 'cd-api-dev-env'],
        hostname: 'redis.cd-api.local',
        ip4Addresses: ['192.168.1.100', '10.0.0.1'],
        publicUrl: 'redis://redis.cd-api.local:6379',
      },
    ],
  },
  {
    serviceName: 'mysql',
    context: ['cd-api', 'cd-api-dev-env'],
    serviceType: 'storage',
    osServiceManager: 'systemd',
    command: 'sudo service mysql start', // Execution command
    workstationAccess: {
      accessScope: 'local',
      physicalAccess: 'direct',
      interactionType: 'cli',
    },
    networkConfig: [
      {
        name: 'MySQL Localhost',
        context: ['cd-api', 'cd-api-dev-env'],
        hostname: 'localhost',
        ip4Addresses: ['127.0.0.1'],
        servicePorts: {
          portMapping: [{ port: 3306, protocol: 'TCP' }],
        },
      },
      {
        name: 'MySQL External',
        context: ['cd-api', 'cd-api-dev-env'],
        hostname: 'mysql.cd-api.local',
        ip4Addresses: ['0.0.0.0'],
        publicUrl: 'mysql://mysql.cd-api.local:3306',
      },
    ],
  },
];

export const defaultService: BaseServiceDescriptor = {
  serviceName: 'unknown',
  serviceType: 'unknown',
  command: 'sudo service redis-server start', // Execution command
  workstationAccess: {
    accessScope: 'local',
    physicalAccess: 'direct',
    interactionType: 'cli',
  },
};

export function getServiceByName(
  names: string[],
  resources: BaseServiceDescriptor[],
): BaseServiceDescriptor[] {
  const foundServices = resources.filter((service) =>
    names.some(
      (name) => service.serviceName.toLowerCase() === name.toLowerCase(),
    ),
  );

  return foundServices.length > 0 ? foundServices : [defaultService];
}
