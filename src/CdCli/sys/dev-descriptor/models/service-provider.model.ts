// import type { ServiceProviderDescriptor } from './app-descriptor.model';

import type { BaseDescriptor } from './base-descriptor.model.js';
import type { BaseServiceDescriptor } from './service-descriptor.model.js';

export interface ServiceProviderDescriptor extends BaseDescriptor {
  providerName: string; // Name of the service provider (e.g., AWS, Google Cloud, Azure)
  accountId?: string; // Identifier for the user's account with the provider
  credentials: AccountCredentials; // Global credentials for the service provider
  servicesInUse: BaseServiceDescriptor[]; // Array of services being utilized
  dataCenterLocation?: DataCenterLocation; // Information about the provider's data center
  metadata?: ProviderMetadata; // Additional metadata for extensibility
}

// Supporting Interfaces
export interface AccountCredentials extends BaseDescriptor {
  apiKey?: string; // API Key for authentication
  oauthToken?: string; // OAuth token
  sshKeyPath?: string; // Path to SSH key for authentication
  username?: string; // Username for access
  password?: string; // Password for access
}

export interface DataCenterLocation extends BaseDescriptor {
  region: string; // Region of the data center (e.g., us-east-1, europe-west1)
  country: string; // Country where the data center is located
  complianceStandards?: string[]; // Compliance standards met (e.g., GDPR, HIPAA)
}

export interface UsageMetrics extends BaseDescriptor {
  currentUsage?: MetricsQuantity; // Current usage (e.g., GB, hours, API calls)
  quota?: MetricsQuantity; // Quota limit
  utilizationPercentage?: MetricsQuantity; // Utilization as a percentage
  billingCost?: MetricsQuantity; // Current cost for this service
}

export interface MetricsQuantity extends BaseDescriptor {
  units: string;
  value: number;
}

export interface ProviderMetadata extends BaseDescriptor {
  description?: string; // Description of the service provider
  website?: string; // URL to the provider's website
  supportContact?: string; // Contact information for support
  integrationNotes?: string; // Notes about integration with the provider
}

export interface AccountCredentials extends BaseDescriptor {
  type: 'apiKey' | 'usernamePassword' | 'oauth' | 'custom' | 'unknown'; // Type of authentication
  apiKey?: string; // API key, if applicable
  username?: string; // Username, if applicable
  password?: string; // Password, if applicable
  token?: string; // OAuth token or custom token, if applicable
  customAuthConfig?: Record<string, any>; // Custom configurations for provider-specific credentials
}

export interface ProviderInstruction extends BaseDescriptor {
  description: string; // Description of the provider-specific instruction
  configPath: string; // Path to the configuration file or script
  additionalDetails?: Record<string, any>; // Additional details or metadata
}

// export const serviceProviders: ServiceProviderDescriptor[] = [
//   {
//     providerName: 'AWS',
//     accountId: '123456789',
//     credentials: {
//       type: 'apiKey',
//       apiKey: 'AKIAxxxxxxxxxxxxxxxx',
//     },
//     servicesInUse: [
//       {
//         serviceName: 'S3',
//         serviceType: 'storage',
//         credentials: {
//           type: 'apiKey',
//           apiKey: 'AKIAxxxxxxxxxxxxxxxx',
//         },
//         usageMetrics: {
//           currentUsage: { units: 'GB', value: 150 },
//           quota: { units: 'GB', value: 500 },
//           utilizationPercentage: { units: '%', value: 30 },
//           billingCost: { units: 'USD', value: 20.0 },
//         },
//         configuration: {
//           bucketName: 'my-data-bucket',
//           versioningEnabled: true,
//         },
//         availabilityZones: ['us-east-1', 'us-west-2'],
//       },
//       {
//         serviceName: 'EC2',
//         serviceType: 'compute',
//         usageMetrics: {
//           currentUsage: { units: 'hours', value: 70 },
//           quota: { units: 'hours', value: 100 },
//           utilizationPercentage: { units: '%', value: 70 },
//           billingCost: { units: 'USD', value: 50.0 },
//         },
//       },
//     ],
//     dataCenterLocation: {
//       region: 'us-east-1',
//       country: 'United States',
//       complianceStandards: ['GDPR', 'ISO27001'],
//     },
//     metadata: {
//       description: 'AWS account for cloud services',
//       website: 'https://aws.amazon.com',
//       supportContact: 'support@aws.amazon.com',
//     },
//   },
//   {
//     providerName: 'GCP',
//     accountId: 'gcp-987654321',
//     credentials: {
//       type: 'oauth',
//       token: 'ya29.a0Afxxxxxxxxxxxxxx',
//     },
//     servicesInUse: [
//       {
//         serviceName: 'Compute Engine',
//         serviceType: 'compute',
//         usageMetrics: {
//           currentUsage: { units: 'hours', value: 120 },
//           quota: { units: 'hours', value: 300 },
//           utilizationPercentage: { units: '%', value: 40 },
//           billingCost: { units: 'USD', value: 60.0 },
//         },
//         configuration: {
//           instanceType: 'n2-standard-4',
//         },
//       },
//       {
//         serviceName: 'Cloud Storage',
//         serviceType: 'storage',
//         usageMetrics: {
//           currentUsage: { units: 'GB', value: 500 },
//           quota: { units: 'GB', value: 1000 },
//           utilizationPercentage: { units: '%', value: 50 },
//           billingCost: { units: 'USD', value: 45.0 },
//         },
//         availabilityZones: ['us-central1', 'europe-west1'],
//       },
//     ],
//     dataCenterLocation: {
//       region: 'us-central1',
//       country: 'United States',
//       complianceStandards: ['SOC2', 'PCI-DSS'],
//     },
//     metadata: {
//       description: 'Google Cloud Platform account',
//       website: 'https://cloud.google.com',
//       supportContact: 'support@googlecloud.com',
//     },
//   },
//   {
//     providerName: 'Azure',
//     accountId: 'azure-555666',
//     credentials: {
//       type: 'usernamePassword',
//       username: 'azureAdmin',
//       password: 'password123',
//     },
//     servicesInUse: [
//       {
//         serviceName: 'Blob Storage',
//         serviceType: 'storage',
//         usageMetrics: {
//           currentUsage: { units: 'GB', value: 250 },
//           quota: { units: 'GB', value: 1000 },
//           utilizationPercentage: { units: '%', value: 25 },
//           billingCost: { units: 'USD', value: 30.0 },
//         },
//       },
//     ],
//     dataCenterLocation: {
//       region: 'westeurope',
//       country: 'Netherlands',
//       complianceStandards: ['GDPR'],
//     },
//     metadata: {
//       description: 'Azure account for Europe-based services',
//       website: 'https://azure.microsoft.com',
//       supportContact: 'support@azure.com',
//     },
//   },
//   {
//     providerName: 'DigitalOcean',
//     credentials: {
//       type: 'apiKey',
//       apiKey: 'do_key_12345',
//     },
//     servicesInUse: [
//       {
//         serviceName: 'Droplets',
//         serviceType: 'compute',
//         usageMetrics: {
//           currentUsage: { units: 'hours', value: 50 },
//           quota: { units: 'hours', value: 200 },
//           utilizationPercentage: { units: '%', value: 25 },
//           billingCost: { units: 'USD', value: 10.0 },
//         },
//       },
//     ],
//     dataCenterLocation: {
//       region: 'sgp1',
//       country: 'Singapore',
//     },
//     metadata: {
//       description: 'DigitalOcean account for lightweight deployments',
//       website: 'https://www.digitalocean.com',
//     },
//   },
//   {
//     providerName: 'Linode',
//     accountId: 'linode-888777',
//     credentials: {
//       type: 'apiKey',
//       apiKey: 'lin_key_67890',
//     },
//     servicesInUse: [
//       {
//         serviceName: 'Object Storage',
//         serviceType: 'storage',
//         usageMetrics: {
//           currentUsage: { units: 'GB', value: 100 },
//           quota: { units: 'GB', value: 500 },
//           utilizationPercentage: { units: '%', value: 20 },
//           billingCost: { units: 'USD', value: 15 },
//         },
//       },
//     ],
//     dataCenterLocation: {
//       region: 'us-east',
//       country: 'United States',
//     },
//     metadata: {
//       description: 'Linode account for object storage',
//       website: 'https://www.linode.com',
//     },
//   },
//   {
//     providerName: 'GitHub',
//     credentials: {
//       type: 'oauth',
//       token: 'ghp_exampleToken',
//     },
//     servicesInUse: [],
//     dataCenterLocation: {
//       region: 'global',
//       country: 'United States',
//     },
//     metadata: {
//       description: 'GitHub for repositories',
//       website: 'https://github.com',
//       supportContact: 'support@github.com',
//     },
//   },
//   {
//     providerName: 'GitLab',
//     credentials: {
//       type: 'apiKey',
//       apiKey: 'gitlabApiKey123',
//     },
//     servicesInUse: [],
//     dataCenterLocation: {
//       region: 'global',
//       country: 'United States',
//     },
//     metadata: {
//       description: 'GitLab for CI/CD and repositories',
//       website: 'https://gitlab.com',
//       supportContact: 'support@gitlab.com',
//     },
//   },
// ];

export const defaultProvider: ServiceProviderDescriptor = {
  providerName: 'Unknown',
  credentials: {
    type: 'custom',
    customAuthConfig: {},
  },
  servicesInUse: [],
};

export function getServiceProviderByName(
  name: string,
  providers: ServiceProviderDescriptor[],
): ServiceProviderDescriptor {
  return (
    providers.find(
      (provider) => provider.providerName.toLowerCase() === name.toLowerCase(),
    ) || defaultProvider
  );
}
