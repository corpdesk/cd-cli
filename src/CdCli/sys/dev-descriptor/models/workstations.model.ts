/* eslint-disable style/brace-style */
import type { CdFxReturn } from '../../base/IBase.js';

import type { ProfileModel } from '../../cd-cli/models/cd-cli-profile.model.js';
import type { EnvironmentService } from '../services/environment.service.js';
import type { BaseDescriptor } from './base-descriptor.model.js';
import type { ContainerDescriptor } from './container-manager.model.descriptor.js';
/* eslint-disable antfu/if-newline */
// import type { WorkstationDescriptor } from './dev-descriptor.model';
// import type { OperatingSystemDescriptor } from './app-descriptor.model';
import {
  cdApiDependencies,
  type DependencyDescriptor,
} from '../../dev-descriptor/models/dependancy-descriptor.model.js';
import {
  CdApiSetupTasks,
  type CiCdDescriptor,
  type CICdTask,
} from './cicd-descriptor.model.js';
// import type { ContainerDescriptor } from './container-manager.model.descriptor';
import type { EnvironmentDescriptor } from './environment.model.js';
import type { MetricsQuantity } from './service-provider.model.js';
import type { VersionControlDescriptor } from './version-control.model.js';
import CdLog from '../../cd-comm/controllers/cd-logger.controller.js';
import { defaultOs, getOsByName, operatingSystems } from './os.model.js';
import {
  getPermissionsByName,
  getPermissionsByRoleNames,
  roles,
} from './permissions.model.js';
import {
  defaultSoftware,
  getSoftwareByName,
  softwareDataStore,
} from './software-store.model.js';
import {
  getTestingFramework,
  getTestingFrameworkByContext,
  testingFrameworks,
} from './testing-framework.model.js';

/**
 * Questions:
 * - virtualization and container should be under machine type or machine type should be integrated with a property called host
 */
export interface WorkstationDescriptor extends BaseDescriptor {
  machineType: MachineType;
  os: OperatingSystemDescriptor;
  enabled?: boolean;
  workstationAccess: WorkstationAccessDescriptor;
  requiredSoftware: DependencyDescriptor[];
}

export interface SystemResources extends BaseDescriptor {
  cpuCores: number; // Number of CPU cores
  memory: MetricsQuantity; // e.g., "32GB" {units: 'GB',value: 32}
  storage: MetricsQuantity; // e.g., "1TB"
}

export interface OperatingSystemDescriptor extends BaseDescriptor {
  name: string; // Name of the operating system (e.g., Windows, Linux, macOS)
  version: string; // Version of the operating system (e.g., "10.0.19044", "Ubuntu 22.04")
  architecture: 'x86_64' | 'x86' | 'x64' | 'ARM' | 'ARM64' | 'unknown'; // CPU architecture supported by the OS
  kernelVersion?: string; // Optional: Specific kernel version (e.g., "5.15.0-79-generic")
  distribution?: string; // Optional: For Linux distros (e.g., "Ubuntu", "Fedora")
  buildNumber?: string; // Optional: Build number for the OS (e.g., Windows-specific)
  environmentVariables?: { [key: string]: string }; // Optional: Key-value pairs of environment variables
  timezone: string; // Timezone of the environment (e.g., "UTC", "America/New_York")
}

// Physical Machine Descriptor
export interface PhysicalMachineDescriptor extends BaseDescriptor {
  systemResources: SystemResources; // Total physical resources
  powerState?: 'on' | 'off' | 'suspended' | 'unknown';
  networkInterfaces: NetworkInterfaceDescriptor[]; // Physical network interfaces
}

// Virtual Machine Descriptor
export interface VirtualMachineDescriptor extends BaseDescriptor {
  hypervisor:
    | 'KVM'
    | 'VMware'
    | 'VirtualBox'
    | 'Hyper-V'
    | 'Xen'
    | 'Other'
    | 'unknown';
  vmId: string;
  allocatedResources: SystemResources; // Resources allocated to this VM
  networkMode: 'bridged' | 'nat' | 'host-only';
  state: 'running' | 'stopped' | 'paused' | 'unknown';
}

// export type MachineType = 'physical' | 'virtual' | 'container';
export interface MachineType extends BaseDescriptor {
  name: 'physical' | 'virtual' | 'container' | 'unknown';
  hostMachine:
    | PhysicalMachineDescriptor
    | VirtualMachineDescriptor
    | ContainerDescriptor;
}

export interface WorkstationAccessDescriptor extends BaseDescriptor {
  accessScope?: 'local' | 'remote' | 'hybrid' | 'unknown';
  physicalAccess?: 'direct' | 'vpn' | 'tunnel' | 'unknown';
  /**
   * transport may be optional if physicalAccess = direct
   */
  transport?: {
    protocol: 'ssh' | 'http' | 'rdp' | 'grpc' | 'other' | 'unknown';
    credentials?: TransportCredentials; // Holds authentication details based on protocol
  };
  interactionType?: 'cli' | 'gui' | 'api' | 'desktop' | 'unknown';
}

// Define a flexible structure for transport-specific credentials
export interface TransportCredentials extends BaseDescriptor {
  sshCredentials?: SshCredentials;
  httpCredentials?: HttpCredentials;
  rdpCredentials?: RdpCredentials;
  grpcCredentials?: GrpcCredentials;
  otherCredentials?: Record<string, unknown>; // Allows future expansion
}

// Keep SSH credentials definition unchanged
export interface SshCredentials extends BaseDescriptor {
  username: string;
  host: string;
  port: number;
  privateKey?: string;
  password?: string;
}

// Example HTTP authentication credentials
export interface HttpCredentials extends BaseDescriptor {
  username: string;
  password: string;
  token?: string; // Supports bearer tokens for APIs
}

// Example RDP authentication credentials
export interface RdpCredentials extends BaseDescriptor {
  username: string;
  password: string;
  domain?: string; // Optional for Windows domain logins
}

// Example gRPC authentication credentials
export interface GrpcCredentials extends BaseDescriptor {
  apiKey?: string;
  cert?: string; // Optional certificate for secure connections
  token?: string;
}

// Condition Descriptor
export interface ConditionDescriptor extends BaseDescriptor {
  type: 'time-based' | 'location-based' | 'context-based' | 'other' | 'unknown'; // Type of condition
  details: Record<string, any>; // Details of the condition (e.g., time range, IP address)
}

// Comprehensive OS Permissions Descriptor
export interface OperatingSystemPermissionDescriptor extends BaseDescriptor {
  basePermissions: PermissionDescriptor[]; // List of base permissions defined in the system
  accessControls: AccessControlDescriptor[]; // Access control rules
  auditConfig?: AuditDescriptor; // Audit configuration for permissions
  roles?: RoleDescriptor[]; // Optional roles for role-based access control
}

// Base Permission Descriptor
export interface PermissionDescriptor extends BaseDescriptor {
  name: string; // Name of the permission (e.g., "read", "write", "execute")
  description?: string; // Description of the permission
  level: 'user' | 'group' | 'system' | 'unknown' | 'unknown' | 'unknown'; // Level of the permission (e.g., user, group, or system-wide)
  type: 'file' | 'directory' | 'process' | 'network' | 'service' | 'unknown'; // Type of resource the permission applies to
}

// Access Control Descriptor
export interface AccessControlDescriptor extends BaseDescriptor {
  subject: string; // Subject (user, group, or process) the permission applies to
  resource: string; // Resource (e.g., file path, directory, process ID, service name)
  allowedActions: (
    | 'read'
    | 'write'
    | 'execute'
    | 'delete'
    | 'modify'
    | 'create'
    | 'unknown'
  )[]; // Allowed actions on the resource
  conditions?: ConditionDescriptor[]; // Optional conditions or constraints
}

// Audit Descriptor
export interface AuditDescriptor extends BaseDescriptor {
  logChanges: boolean; // Whether changes to the permissions should be logged
  lastModifiedBy?: string; // User or process that last modified the permission
  lastModifiedAt?: Date; // Timestamp of the last modification
  auditTrail?: string[]; // Log of previous changes
}

// Role-Based Access Control Descriptor (Optional)
export interface RoleDescriptor extends BaseDescriptor {
  roleName: string; // Name of the role (e.g., "admin", "user", "guest")
  permissions: PermissionDescriptor[]; // List of permissions assigned to this role
}

export interface FileStoreDescriptor extends BaseDescriptor {
  name: string; // Unique identifier for the file store
  type:
    | 'local'
    | 'network'
    | 'object-storage'
    | 'distributed'
    | 'container-managed'
    | 'unknown'; // Type of file storage

  fileStorageCapacity: FileStorageCapacity; // Storage capacity details
  fileStorageLocation: FileStorageLocation; // Storage location details
  fileStorageAccess: FileStorageAccess; // Access control details
  fileStorageRedundancy?: FileStorageRedundancy; // Redundancy details
  fileStorageEncryption?: FileStorageEncryption; // Encryption details
  fileStoragePerformance?: FileStoragePerformance; // Performance details
  fileStorageIntegration?: FileStorageIntegration; // Integration details
  fileStorageBackup?: FileStorageBackup; // Backup details
  fileStorageMetadata?: FileStorageMetadata; // Metadata details
}

// Root Interface
export interface NetworkInterfaceDescriptor extends BaseDescriptor {
  hostname: string; // Hostname of the workstation
  ip4Addresses?: string[]; // List of IPv4 addresses
  ip6Addresses?: string[]; // List of IPv6 addresses
  servicePorts?: ServicePortConfig; // Port configurations
  publicUrl?: string; // Public URL of the service
  firewallRules?: FirewallRule[]; // Firewall rules for allowed IPs and protocols
  dnsConfig?: DNSConfig; // DNS configuration
  routingConfig?: RoutingConfig; // Routing-related configurations
  proxySettings?: ProxySettings; // Proxy server settings
  networkPolicies?: NetworkPolicy[]; // Policies governing network behavior
}

// Service Port Configurations
// export interface ServicePortConfig extends BaseDescriptor {
//   http?: number; // HTTP port
//   https?: number; // HTTPS port
//   portMapping?: PortMapping[]; // Port mapping details, including forwarding, ingress, and egress
// }
export interface ServicePortConfig extends BaseDescriptor {
  http?: number; // HTTP port
  https?: number; // HTTPS port
  ports?: Record<string, number[]>; // Generic protocol-based port mapping (e.g., tcp, udp)
  portMapping?: PortMapping[]; // Port mapping details, including forwarding, ingress, and egress
}

// Port Mapping Details
// export interface PortMapping extends BaseDescriptor {
//   containerPort: number; // Port inside the container/application
//   hostPort?: number; // Port exposed on the host
//   protocol: 'TCP' | 'UDP' | 'unknown'; // Protocol type
//   ingress?: IngressConfig; // Ingress rules for this port
//   egress?: EgressConfig; // Egress rules for this port
// }
export interface PortMapping extends BaseDescriptor {
  port: number; // Port used by the service
  protocol: 'TCP' | 'UDP' | 'unknown'; // Protocol type
  ingress?: IngressConfig; // Ingress rules for this port
  egress?: EgressConfig; // Egress rules for this port
}

// Ingress Configuration
export interface IngressConfig extends BaseDescriptor {
  allowedSources?: string[]; // Allowed source IPs or CIDR blocks
  rateLimit?: number; // Maximum number of requests per second
  tlsEnabled?: boolean; // Whether TLS is enabled for this port
}

// Egress Configuration
export interface EgressConfig extends BaseDescriptor {
  allowedDestinations?: string[]; // Allowed destination IPs or CIDR blocks
  bandwidthLimit?: string; // Bandwidth limit for egress traffic (e.g., "100Mbps")
}

// Firewall Rules
export interface FirewallRule extends BaseDescriptor {
  id?: string; // Unique identifier for the rule
  action: 'allow' | 'deny' | 'unknown'; // Action to take (allow or deny)
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'unknown'; // Protocol for the rule
  portRange?: { from: number; to: number }; // Port range (optional)
  source?: string; // Source IP or CIDR (optional)
  destination?: string; // Destination IP or CIDR (optional)
  description?: string; // Description of the rule
}

// DNS Configuration
export interface DNSConfig extends BaseDescriptor {
  primary: string; // Primary DNS server
  secondary?: string; // Secondary DNS server
  searchDomains?: string[]; // List of search domains
  records?: DNSRecord[]; // DNS records
}

// DNS Record
export interface DNSRecord extends BaseDescriptor {
  provider: 'route53' | 'google-dns' | 'cloudflare' | 'custom' | 'unknown'; // DNS provider
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'unknown'; // DNS record type
  name: string; // Name of the record
  value: string; // Value of the record
  ttl?: number; // Time-to-live (TTL) in seconds
}

// Routing Configuration
export interface RoutingConfig extends BaseDescriptor {
  staticRoutes?: StaticRoute[]; // Static routes
  loadBalancing?: LoadBalancingConfig; // Load balancing settings
}

// Static Route
export interface StaticRoute extends BaseDescriptor {
  destination: string; // Destination CIDR block
  gateway: string; // Gateway for the route
  metric?: number; // Priority metric for the route
}

// Load Balancing Configuration
export interface LoadBalancingConfig extends BaseDescriptor {
  strategy: 'round-robin' | 'least-connections' | 'ip-hash' | 'unknown'; // Load balancing strategy
  healthCheck?: {
    interval: number; // Health check interval in seconds
    timeout: number; // Timeout in seconds
    retries: number; // Number of retries before marking unhealthy
  };
}

// Proxy Settings
export interface ProxySettings extends BaseDescriptor {
  httpProxy?: string; // HTTP proxy URL
  httpsProxy?: string; // HTTPS proxy URL
  noProxy?: string[]; // List of domains or IPs to bypass the proxy
}

// Network Policy
export interface NetworkPolicy extends BaseDescriptor {
  name: string; // Policy name
  description?: string; // Description of the policy
  allowedIngress?: IngressConfig[]; // Allowed ingress configurations
  allowedEgress?: EgressConfig[]; // Allowed egress configurations
}

export interface VolumeMapping extends BaseDescriptor {
  hostPath: string; // Host machine path
  containerPath: string; // Container path
}

// export interface PortMapping {
//   hostPort: number; // Host machine port
//   containerPort: number; // Container port
// }

export interface HardwareSpecs extends BaseDescriptor {
  cpu: CpuSpecs;
  memory: MemorySpecs;
  fileStorage: FileStoreDescriptor[];
  gpu?: GpuSpecs;
}

export interface FileReference extends BaseDescriptor {
  name: string; // Logical name of the file reference (e.g., "packageJson", "dockerCompose")
  filePath: string; // Path to the file (relative or absolute)
  format: 'json' | 'yaml' | 'xml' | 'text' | 'unknown'; // Format of the file
  section?: string | string[]; // Optional: Section(s) of the file to extract (e.g., "dependencies" for package.json)
  description?: string; // Description of the purpose of this file reference
}

// Interface for File Storage Capacity
export interface FileStorageCapacity extends BaseDescriptor {
  size: string; // Total storage size (e.g., "500GB", "2TB")
  autoScaling?: boolean; // Whether storage can auto-scale
  quota?: {
    userLimit?: string; // Per-user storage limit (e.g., "10GB")
    groupLimit?: string; // Per-group storage limit
  };
}

// Interface for File Storage Location
export interface FileStorageLocation extends BaseDescriptor {
  path?: string; // Path for local or network file storage
  bucketName?: string; // Bucket name for object storage
  region?: string; // Region for cloud-based storage (e.g., "us-east-1")
  endpoints?: string[]; // Custom endpoints for distributed or object storage
}

// Interface for File Storage Access
export interface FileStorageAccess extends BaseDescriptor {
  fileStorageAccessType: 'public' | 'private' | 'restricted' | 'unknown'; // Access control type
  osPermissions?: PermissionDescriptor[];
  authentication?: AuthenticationConfig;
}

export interface AuthenticationConfig extends BaseDescriptor {
  type: 'key-based' | 'token-based' | 'role-based' | 'none' | 'unknown'; // Authentication mechanism
  credentials?: {
    apiKey?: string; // API key for access
    token?: string; // Authentication token
    user?: string; // Username
    password?: string; // Password
    roles?: string[]; // Role-based access roles
  };
}

// Interface for File Storage Redundancy
export interface FileStorageRedundancy extends BaseDescriptor {
  enabled: boolean; // Whether redundancy is enabled
  strategy?: 'mirroring' | 'striping' | 'parity' | 'unknown'; // Redundancy strategy
  replicas?: number; // Number of replicas for redundancy
}

// Interface for File Storage Encryption
export interface FileStorageEncryption extends BaseDescriptor {
  enabled: boolean; // Whether encryption is enabled
  atRest?: boolean; // Encrypt files at rest
  inTransit?: boolean; // Encrypt files during transit
  algorithm?: string; // Encryption algorithm (e.g., "AES-256")
}

// Interface for File Storage Performance
export interface FileStoragePerformance extends BaseDescriptor {
  maxThroughput?: string; // Maximum throughput (e.g., "1Gbps")
  latency?: string; // Expected latency (e.g., "10ms")
  caching?: {
    enabled: boolean; // Whether caching is enabled
    type?: 'local' | 'distributed' | 'unknown'; // Type of caching
    size?: string; // Cache size (e.g., "10GB")
  };
}

// Interface for File Storage Integration
export interface FileStorageIntegration extends BaseDescriptor {
  containerManager?: {
    manager: 'kubernetes' | 'docker'; // Container manager type
    volumeType: 'persistentVolume' | 'configMap' | 'emptyDir' | 'unknown'; // Volume type
    mountPath: string; // Mount path inside the container
    accessModes: string[]; // Kubernetes access modes (e.g., "ReadWriteOnce", "ReadOnlyMany")
  };
  cloudProvider?: {
    provider: 'aws-s3' | 'gcp-storage' | 'azure-blob' | 'unknown'; // Cloud provider
    sdkVersion?: string; // SDK version for interaction
    customEndpoints?: string[]; // Custom endpoints for interaction
  };
}

// Interface for File Storage Backup
export interface FileStorageBackup extends BaseDescriptor {
  enabled: boolean; // Whether backups are enabled
  schedule?: string; // Cron-like schedule for backups (e.g., "0 3 * * *")
  retentionPolicy?: string; // Retention policy (e.g., "30d" for 30 days)
  destination?: string; // Destination for backups (e.g., S3 bucket, NFS path)
}

// Interface for File Storage Metadata
export interface FileStorageMetadata extends BaseDescriptor {
  description?: string; // Description of the file store
  createdBy?: string; // Creator of the file store
  tags?: string[]; // Tags for categorization
  createdAt?: string; // Creation timestamp
  lastModified?: string; // Last modification timestamp
}

export interface CpuSpecs extends BaseDescriptor {
  model: string; // CPU model (e.g., "Intel Core i7-12700K")
  cores: number; // Number of CPU cores
  threads: number; // Number of CPU threads
}

export interface GpuSpecs extends BaseDescriptor {
  model: string; // Optional: GPU model (e.g., "NVIDIA RTX 3080")
  memory: number; // GPU memory in MB
}

export interface MemorySpecs extends BaseDescriptor {
  total: number; // Total memory in MB
  used?: number; // Optional: Memory currently in use in MB
}

export interface SshCredentials extends BaseDescriptor {
  username: string; // SSH username (for remote workstations)
  host: string; // SSH host address (e.g., "192.168.1.100")
  port: number; // SSH port (default: 22)
  privateKey?: string; // Optional: Path or content of the SSH private key
  password?: string; // Optional: Password for SSH authentication
}

export const fileStorages: FileStoreDescriptor[] = [
  {
    name: 'Basic Storage',
    type: 'local',
    fileStorageCapacity: {
      size: '500GB',
      autoScaling: false,
    },
    fileStorageLocation: {
      path: '/local/storage',
    },
    fileStorageAccess: {
      fileStorageAccessType: 'private',
      osPermissions: getPermissionsByRoleNames(['admin', 'user'], roles),
    },
  },
  {
    name: 'Advanced Storage',
    type: 'network',
    fileStorageCapacity: {
      size: '2TB',
      autoScaling: true,
      quota: {
        userLimit: '100GB',
      },
    },
    fileStorageLocation: {
      path: '\\\\network\\storage',
    },
    fileStorageAccess: {
      fileStorageAccessType: 'restricted',
      authentication: {
        type: 'role-based',
        credentials: {
          roles: ['admin', 'user'],
        },
      },
    },
  },
  {
    name: 'Premium Storage',
    type: 'object-storage',
    fileStorageCapacity: {
      size: '5TB',
      autoScaling: true,
    },
    fileStorageLocation: {
      bucketName: 'premium-storage-bucket',
      region: 'us-east-1',
    },
    fileStorageAccess: {
      fileStorageAccessType: 'public',
    },
  },
  {
    name: 'Default Storage',
    type: 'distributed',
    fileStorageCapacity: {
      size: '1TB',
      autoScaling: true,
    },
    fileStorageLocation: {
      endpoints: ['endpoint1.example.com', 'endpoint2.example.com'],
    },
    fileStorageAccess: {
      fileStorageAccessType: 'restricted',
      authentication: {
        type: 'token-based',
        credentials: {
          token: 'default-storage-token',
        },
      },
    },
  },
];

export enum FileStorageOption {
  Basic = 'Basic Storage',
  Advanced = 'Advanced Storage',
  Premium = 'Premium Storage',
  Default = 'Default Storage',
}

export const workstations: WorkstationDescriptor[] = [
  /**
   * local workstation for testing setting up
   * development and production environments
   */
  {
    name: 'emp-12',
    machineType: {
      name: 'physical',
      hostMachine: {
        systemResources: {
          cpuCores: 4, // Number of CPU cores
          memory: { units: 'GB', value: 32 }, // e.g., "32GB"
          storage: { units: 'TB', value: 1 }, // e.g., "1TB"
        }, // Total physical resources
        networkInterfaces: [
          {
            hostname: 'localhost', // Hostname of the workstation
            ip4Addresses: ['127.0.0.1', '192.168.1.6'], // List of IPv4 addresses
          },
          {
            hostname: 'emp-12', // Hostname of the workstation
            ip4Addresses: ['192.168.1.6'], // List of IPv4 addresses
          },
        ], // Resources allocated to this container
      },
    },
    os: {
      name: 'Ubuntu',
      version: '22.04',
      architecture: 'x86_64',
      kernelVersion: '5.15.0-79-generic',
      distribution: 'Ubuntu',
      timezone: 'UTC',
    },
    workstationAccess: {
      accessScope: 'local',
      physicalAccess: 'direct',
      interactionType: 'cli',
    },
    requiredSoftware: cdApiDependencies,
  },
  /**
   * container based remote workstation for
   * testing setting up
   * development and production environments
   */
  {
    name: 'emp-13',
    machineType: {
      name: 'container',
      hostMachine: {
        containerId: 'emp-61',
        image: 'ubuntu22.04',
        allocatedResources: {
          cpuCores: 1, // Number of CPU cores
          memory: { units: 'GB', value: 4 }, // e.g., "32GB"
          storage: { units: 'GB', value: 8 }, // e.g., "1TB"
        }, // Resources allocated to this container
      },
    },
    os: {
      name: 'Ubuntu',
      version: '22.04',
      architecture: 'x86_64',
      kernelVersion: '5.15.0-79-generic',
      distribution: 'Ubuntu',
      timezone: 'UTC',
    },
    workstationAccess: {
      accessScope: 'remote',
      physicalAccess: 'tunnel',
      transport: {
        protocol: 'ssh',
        credentials: {
          sshCredentials: {
            username: 'admin',
            privateKey: '/keys/build-server-key',
            host: '123.456.890',
            port: 22,
          },
        },
      },
      interactionType: 'cli',
    },
    requiredSoftware: cdApiDependencies,
  },
  {
    /**
     *
     */
    name: 'emp-12-cd-api',
    description: 'emp-12 laptop machine as host for cd-api',
    workstationAccess: {
      accessScope: 'local',
      physicalAccess: 'direct',
      interactionType: 'cli',
    },
    machineType: {
      name: 'physical',
      hostMachine: {
        containerId: 'ubuntu-03',
        image: 'ubuntu22.04',
        allocatedResources: {
          cpuCores: 4, // Number of CPU cores
          memory: { units: 'GB', value: 32 }, // e.g., "32GB"
          storage: { units: 'TB', value: 1 }, // e.g., "1TB"
        }, // Resources allocated to this container
      },
    },
    os: getOsByName('ubuntu.22.04', operatingSystems)[0],
    enabled: true,
    requiredSoftware: getSoftwareByName(
      ['npm.9.8.1', 'vscode.1.82.0'],
      softwareDataStore,
    ),
  },
  {
    name: 'Windows Build Server',
    workstationAccess: {
      accessScope: 'remote',
      physicalAccess: 'vpn',
      transport: {
        protocol: 'ssh',
        credentials: {
          sshCredentials: {
            username: 'admin',
            privateKey: '/keys/build-server-key',
            host: '123.456.890',
            port: 22,
          },
        },
      },
      interactionType: 'cli',
    },
    machineType: {
      name: 'container',
      hostMachine: {
        containerId: 'ubuntu-03',
        image: 'ubuntu22.04',
        allocatedResources: {
          cpuCores: 1, // Number of CPU cores
          memory: { units: 'GB', value: 4 }, // e.g., "32GB"
          storage: { units: 'GB', value: 8 }, // e.g., "1TB"
        }, // Resources allocated to this container
      },
    },
    // container: ContainerDescriptor;
    os: getOsByName('Windows', operatingSystems)[0],
    enabled: true,
    requiredSoftware: getSoftwareByName(
      ['pnpm.7.16.0', 'apache.2.4.57', 'mysql-server.8.0.34'],
      softwareDataStore,
    ),
  },
  {
    name: 'macOS Developer Laptop',
    workstationAccess: {
      accessScope: 'remote',
      physicalAccess: 'direct',
      transport: {
        protocol: 'ssh',
        credentials: {
          sshCredentials: {
            username: 'admin',
            privateKey: '/keys/build-server-key',
            host: '123.456.890',
            port: 22,
          },
        },
      },
      interactionType: 'cli',
    },
    machineType: {
      name: 'container',
      hostMachine: {
        containerId: 'ubuntu-03',
        image: 'ubuntu22.04',
        allocatedResources: {
          cpuCores: 1, // Number of CPU cores
          memory: { units: 'GB', value: 4 }, // e.g., "32GB"
          storage: { units: 'GB', value: 8 }, // e.g., "1TB"
        }, // Resources allocated to this container
      },
    },
    os: getOsByName('macOS', operatingSystems)[0],
    enabled: true,
    requiredSoftware: getSoftwareByName(
      ['vscode.1.82.0', 'npm.9.8.1', 'lxd.5.0'],
      softwareDataStore,
    ),
  },
  {
    name: 'CentOS Database Server',
    workstationAccess: {
      accessScope: 'remote',
      physicalAccess: 'direct',
      transport: {
        protocol: 'ssh',
        credentials: {
          sshCredentials: {
            username: 'admin',
            privateKey: '/keys/build-server-key',
            host: '123.456.890',
            port: 22,
          },
        },
      },
      interactionType: 'cli',
    },
    machineType: {
      name: 'container',
      hostMachine: {
        containerId: 'ubuntu-03',
        image: 'ubuntu22.04',
        allocatedResources: {
          cpuCores: 1, // Number of CPU cores
          memory: { units: 'GB', value: 4 }, // e.g., "32GB"
          storage: { units: 'GB', value: 8 }, // e.g., "1TB"
        }, // Resources allocated to this container
      },
    },
    os: getOsByName('CentOS', operatingSystems)[0],
    enabled: true,
    requiredSoftware: getSoftwareByName(
      ['mysql-server.8.0.34'],
      softwareDataStore,
    ),
  },
];

export const defaultWorkstation: WorkstationDescriptor = {
  name: 'unknown',
  workstationAccess: {
    accessScope: 'local',
    physicalAccess: 'direct',
    transport: {
      protocol: 'ssh',
      credentials: {
        sshCredentials: {
          username: 'unknown',
          host: '127.0.0.1',
          port: -1,
        },
      },
    },
    interactionType: 'cli',
  },
  machineType: {
    name: 'container',
    hostMachine: {
      containerId: 'ubuntu-03',
      image: 'ubuntu22.04',
      allocatedResources: {
        cpuCores: 1, // Number of CPU cores
        memory: { units: 'GB', value: 4 }, // e.g., "32GB"
        storage: { units: 'GB', value: 8 }, // e.g., "1TB"
      }, // Resources allocated to this container
    },
  },
  os: getOsByName('ubuntu.22.04', operatingSystems)[0],
  enabled: true,

  requiredSoftware: getSoftwareByName(
    ['npm.9.8.1', 'vscode.1.82.0'],
    softwareDataStore,
  ),
};

export const fileStorageOptions = [
  'Basic Storage',
  'Advanced Storage',
  'Premium Storage',
  'Default Storage',
];

export function getFileStoregeByName(
  names: string[],
  fileStorages: FileStoreDescriptor[],
): FileStoreDescriptor[] {
  const storageMap = new Map(
    fileStorages.map((storage) => [storage.name, storage]),
  );
  const defaultStorage = storageMap.get('Default Storage');
  const invalidRequests: string[] = [];

  const result: FileStoreDescriptor[] = names
    .map((name) => {
      const storage = storageMap.get(name);
      if (!storage) invalidRequests.push(name);
      return storage;
    })
    .filter((storage): storage is FileStoreDescriptor => !!storage);

  if (invalidRequests.length > 0) {
    console.warn('Invalid storage requests:', invalidRequests);
  }

  return result.length > 0 ? result : [defaultStorage!];
}

export function getWorkstationByName(
  name: string,
  ws: WorkstationDescriptor[],
): WorkstationDescriptor {
  const ret = ws.find((workstation) => workstation.name === name);
  if (!ret) {
    return defaultWorkstation;
  } else {
    return ret;
  }
}

export const osPermissions: OperatingSystemPermissionDescriptor = {
  basePermissions: getPermissionsByRoleNames([], roles),
  accessControls: [
    {
      subject: 'user:john',
      resource: '/home/john/docs',
      allowedActions: ['read', 'write'],
      conditions: [
        {
          type: 'time-based',
          details: { startTime: '09:00', endTime: '17:00' },
        },
      ],
    },
    {
      subject: 'group:developers',
      resource: '/var/app',
      allowedActions: ['read', 'write', 'execute'],
    },
  ],
  auditConfig: {
    logChanges: true,
    lastModifiedBy: 'admin',
    lastModifiedAt: new Date(),
    auditTrail: ['Initial setup', 'Added permissions for user:john'],
  },
  roles: [
    {
      roleName: 'admin',
      permissions: [
        {
          name: 'manage_system',
          description: 'Allows full control over the operating system',
          level: 'system',
          type: 'service',
        },
      ],
    },
  ],
};

export const cdApiCiCd: CiCdDescriptor = {
  cICdPipeline: {
    name: 'Corpdesk CI/CD - Bash Deployment',
    type: 'deployment',
    stages: [
      {
        name: 'Setup Environment',
        description: 'Prepare the development environment',
        tasks: CdApiSetupTasks,
      },
    ],
  },
};

export const CdApiRepo: VersionControlDescriptor = {
  repository: {
    name: 'cd-api',
    description: 'api for corpdesk. Also supprts cd-sio push server',
    url: 'https://github.com/corpdesk/cd-api.git',
    type: 'git',
    isPrivate: false,
    directory: '~/', // NEW: Local directory where the repo should be cloned
    credentials: { repoHost: 'corpdesk', accessToken: '#CdVault' },
  },
};

export const emp12DevEnvironment: EnvironmentDescriptor = {
  workstation: getWorkstationByName('emp-12', workstations),
  versionControl: [CdApiRepo],
  ciCd: [cdApiCiCd],
  testingFrameworks: getTestingFrameworkByContext('cd-api', testingFrameworks),
};

export const emp13DevEnvironment: EnvironmentDescriptor = {
  workstation: {
    name: 'emp-13',
    machineType: {
      name: 'container',
      hostMachine: {
        containerId: 'emp-61',
        image: 'ubuntu22.04',
        allocatedResources: {
          cpuCores: 1, // Number of CPU cores
          memory: { units: 'GB', value: 4 }, // e.g., "32GB"
          storage: { units: 'GB', value: 8 }, // e.g., "1TB"
        }, // Resources allocated to this container
      },
    },
    os: {
      name: 'Ubuntu',
      version: '22.04',
      architecture: 'x86_64',
      kernelVersion: '5.15.0-79-generic',
      distribution: 'Ubuntu',
      timezone: 'UTC',
    },
    workstationAccess: {
      accessScope: 'remote',
      physicalAccess: 'tunnel',
      transport: {
        protocol: 'ssh',
        credentials: {
          sshCredentials: {
            username: 'admin',
            privateKey: '/keys/build-server-key',
            host: '123.456.890',
            port: 22,
          },
        },
      },
      interactionType: 'cli',
    },
    requiredSoftware: cdApiDependencies,
  },
  versionControl: [CdApiRepo],
  ciCd: [cdApiCiCd],
  testingFrameworks: getTestingFrameworkByContext('cd-api', testingFrameworks),
};

export const localProfile: ProfileModel = {
  cdCliProfileName: 'Local Development - emp-12',
  cdCliProfileData: {
    owner: {
      userId: 1001,
      groupId: 1001,
    },
    type: 'local', // or the appropriate type string for your use case
    typeId: 1, // or the appropriate typeId number for your use case
    details: emp12DevEnvironment,
    cdVault: [],
    permissions: {
      userPermissions: [],
      groupPermissions: [],
    },
  },
  cdCliProfileEnabled: 1,
  cdCliProfileTypeId: 1,
  userId: 1001,
};

export const remoteProfile: ProfileModel = {
  cdCliProfileName: 'Remote Development - emp-120',
  cdCliProfileData: {
    owner: {
      userId: 1002,
      groupId: 1002,
    },
    type: 'remote', // or the appropriate type string for your use case
    typeId: 2, // or the appropriate typeId number for your use case
    details: emp13DevEnvironment,
    cdVault: [
      {
        name: 'sshPrivateKey',
        description: 'SSH key for accessing remote machine',
        value: null,
        encryptedValue: 'ENCRYPTED_SSH_KEY',
        isEncrypted: true,
      },
    ],
    permissions: {
      userPermissions: [],
      groupPermissions: [],
    },
  },
  cdCliProfileEnabled: 1,
  cdCliProfileTypeId: 2, // SSH profile type
  userId: 1002,
};
