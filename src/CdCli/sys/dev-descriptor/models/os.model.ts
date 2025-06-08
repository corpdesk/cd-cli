import type { OperatingSystemDescriptor } from './workstations.model.js';

export const operatingSystems: OperatingSystemDescriptor[] = [
  {
    name: 'Windows',
    version: '10',
    architecture: 'x64',
    kernelVersion: '10.0.19044',
    timezone: 'UTC',
    // allocatedResources: {
    //   cpuCores: 4, // Number of CPU cores
    //   memory: { units: 'GB', value: 32 }, // e.g., "32GB"
    //   storage: { units: 'TB', value: 1 }, // e.g., "1TB"
    // },
    // hostname: 'dev-machine',
    // ipAddresses: ['192.168.0.2'],
    // isVirtualized: false,
  },
  {
    name: 'ubuntu.22.04',
    version: '22.04',
    architecture: 'x64',
    kernelVersion: '5.15.0-79-generic',
    distribution: 'Ubuntu',
    timezone: 'Africa/Nairobi',
    // allocatedResources: {
    //   cpuCores: 4, // Number of CPU cores
    //   memory: { units: 'GB', value: 32 }, // e.g., "32GB"
    //   storage: { units: 'TB', value: 1 }, // e.g., "1TB"
    // },
    // hostname: 'prod-server',
    // ipAddresses: ['192.168.1.10'],
    // isVirtualized: true,
    // virtualMachineType: 'KVM',
  },
  {
    name: 'macOS',
    version: '13.2',
    architecture: 'ARM64',
    kernelVersion: 'Darwin 22.3.0',
    timezone: 'America/New_York',
    // allocatedResources: {
    //   cpuCores: 4, // Number of CPU cores
    //   memory: { units: 'GB', value: 32 }, // e.g., "32GB"
    //   storage: { units: 'TB', value: 1 }, // e.g., "1TB"
    // },
    // hostname: 'mac-dev',
    // ipAddresses: ['10.0.0.5'],
    // isVirtualized: false,
  },
  {
    name: 'CentOS',
    version: '7',
    architecture: 'x64',
    kernelVersion: '3.10.0-1160.92.1.el7.x86_64',
    distribution: 'CentOS',
    timezone: 'Asia/Kolkata',
    // allocatedResources: {
    //   cpuCores: 4, // Number of CPU cores
    //   memory: { units: 'GB', value: 32 }, // e.g., "32GB"
    //   storage: { units: 'TB', value: 1 }, // e.g., "1TB"
    // },
    // ipAddresses: ['10.1.1.15'],
    // isVirtualized: true,
    // virtualMachineType: 'VMware',
  },
];

export const defaultOs: OperatingSystemDescriptor = {
  name: 'Unknown',
  version: '0.0',
  architecture: 'x64',
  timezone: 'UTC',
};

// export const environmentVariables: { [key: string]: string } = {
//   NODE_ENV: 'production',
//   DB_HOST: 'localhost',
//   API_KEY: '12345-abcdef',
//   PORT: '3000',
// };

export const environmentVariables: {
  [key: string]: { value: string; context: string[] };
} = {
  NODE_ENV: { value: 'production', context: ['cd-api', 'cd-frontend'] },
  DB_HOST: { value: 'localhost', context: ['cd-api', 'cd-api-dev-env'] },
  API_KEY: {
    value: '12345-abcdef',
    context: ['cd-api', 'cd-api-dev-env', 'cd-cli'],
  },
  PORT: { value: '3000', context: ['cd-api', 'cd-api-dev-env'] },
  CLI_TIMEOUT: { value: '5000', context: ['cd-cli'] },
  LOG_LEVEL: { value: 'verbose', context: ['cd-cli'] },
  API_URL: { value: 'https://api.corpdesk.com', context: ['cd-frontend'] },
  APP_MODE: { value: 'spa', context: ['cd-frontend'] },
};

/**
 * 
 * // Example Usage:
    const apiVars = getEnvironmentVariablesByContext("cd-api");
    console.log(apiVars);
    /*
    Output:
    {
      NODE_ENV: "production",
      DB_HOST: "localhost",
      API_KEY: "12345-abcdef",
      PORT: "3000"
    }

    const cliVars = getEnvironmentVariablesByContext("cd-cli");
    console.log(cliVars);
    /*
    Output:
    {
      API_KEY: "12345-abcdef",
      CLI_TIMEOUT: "5000",
      LOG_LEVEL: "verbose"
    }

 * Retrieves environment variables associated with a given context.
 * @param context The context for which to fetch environment variables.
 * @returns Object containing only the variables relevant to the given context.
 */
export function getEnvironmentVariablesByContext(context: string): {
  [key: string]: string;
} {
  return Object.entries(environmentVariables)
    .filter(([_, data]) => data.context.includes(context))
    .reduce(
      (acc, [key, data]) => {
        acc[key] = data.value;
        return acc;
      },
      {} as { [key: string]: string },
    );
}

/**
 * // Example Usage:
    const selectedVars = getEnvironmentVariablesByNames("cd-api", ["API_KEY", "PORT"]);
    console.log(selectedVars);
    /*
    Output:
    {
      API_KEY: "12345-abcdef",
      PORT: "3000"
    }

 * Retrieves specific environment variables within a given context.
 * @param context The context for which to fetch environment variables.
 * @param names An array of variable names to retrieve.
 * @returns Object containing only the requested environment variables relevant to the given context.
 */
export function getEnvironmentVariablesByNames(
  context: string,
  names: string[],
): { [key: string]: string } {
  return Object.entries(environmentVariables)
    .filter(
      ([key, data]) => data.context.includes(context) && names.includes(key),
    )
    .reduce(
      (acc, [key, data]) => {
        acc[key] = data.value;
        return acc;
      },
      {} as { [key: string]: string },
    );
}

export function getOsByName(
  name: string,
  osStore: OperatingSystemDescriptor[],
): OperatingSystemDescriptor {
  return osStore.find((os) => os.name === name) || defaultOs;
}
