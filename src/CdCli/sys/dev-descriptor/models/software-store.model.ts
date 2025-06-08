/* eslint-disable style/brace-style */
// import type { DependencyDescriptor } from './app-descriptor.model';

import type { DependencyDescriptor } from '../../dev-descriptor/models/dependancy-descriptor.model.js';

export const softwareDataStore: DependencyDescriptor[] = [
  {
    name: 'npm.9.8.1',
    version: '9.8.1',
    category: 'tool',
    type: 'development',
    source: 'npm',
    scope: 'global',
    resolution: { method: 'import', path: '/usr/bin/npm' },
    usage: { usageContext: 'cli' },
    platformCompatibility: {
      languages: ['JavaScript', 'Node.js'],
      os: ['Linux', 'Windows', 'macOS'],
    },
    security: { isSecure: true },
    dependencyMetadata: { description: 'Node package manager', license: 'MIT' },
  },
  {
    name: 'vscode.1.82.0',
    version: '1.82.0',
    category: 'tool',
    type: 'development',
    source: 'system',
    scope: 'local',
    resolution: { method: 'include', path: '/usr/local/bin/code' },
    usage: { usageContext: 'editor' },
    platformCompatibility: {
      os: ['Linux', 'Windows', 'macOS'],
    },
    security: { isSecure: true },
    dependencyMetadata: {
      description: 'Code editor by Microsoft',
      license: 'Custom',
    },
  },
  {
    name: 'pnpm.7.16.0',
    version: '7.16.0',
    category: 'tool',
    type: 'development',
    source: 'npm',
    scope: 'global',
    resolution: { method: 'import', path: '/usr/bin/pnpm' },
    usage: { usageContext: 'cli' },
    platformCompatibility: {
      languages: ['JavaScript', 'Node.js'],
      os: ['Linux', 'Windows', 'macOS'],
    },
    security: { isSecure: true },
    dependencyMetadata: {
      description: 'Fast, disk space-efficient package manager',
      license: 'MIT',
    },
  },
  {
    name: 'apache.2.4.57',
    version: '2.4.57',
    category: 'core',
    type: 'production',
    source: 'system',
    scope: 'global',
    resolution: { method: 'include', path: '/usr/sbin/apache2' },
    usage: { usageContext: 'api' },
    platformCompatibility: {
      os: ['Linux', 'Windows', 'macOS'],
      architectures: ['x86_64', 'arm64'],
    },
    security: { isSecure: true },
    dependencyMetadata: {
      description: 'Apache HTTP Server',
      license: 'Apache-2.0',
    },
  },
  {
    name: 'lxd.5.0',
    version: '5.0',
    category: 'tool',
    type: 'production',
    source: 'system',
    scope: 'global',
    resolution: { method: 'cli', path: '/snap/bin/lxd' },
    usage: { usageContext: 'utility' },
    platformCompatibility: {
      os: ['Linux'],
      architectures: ['x86_64', 'arm64'],
    },
    security: { isSecure: true },
    dependencyMetadata: {
      description: 'Linux Containers Manager',
      license: 'Apache-2.0',
    },
  },
  {
    name: 'incus.1.2.3',
    version: '1.2.3',
    category: 'tool',
    type: 'production',
    source: 'system',
    scope: 'global',
    resolution: { method: 'cli', path: '/usr/local/bin/incus' },
    usage: { usageContext: 'utility' },
    platformCompatibility: {
      os: ['Linux'],
      architectures: ['x86_64', 'arm64'],
    },
    security: { isSecure: true },
    dependencyMetadata: {
      description: 'Container and VM management',
      license: 'Apache-2.0',
    },
  },
  {
    name: 'mysql-server.8.0.34',
    version: '8.0.34',
    category: 'core',
    type: 'production',
    source: 'system',
    scope: 'global',
    resolution: { method: 'include', path: '/usr/bin/mysql' },
    usage: { usageContext: 'service' },
    platformCompatibility: {
      os: ['Linux', 'Windows', 'macOS'],
      architectures: ['x86_64', 'arm64'],
    },
    security: { isSecure: true },
    dependencyMetadata: {
      description: 'Relational database management system',
      license: 'GPL',
    },
  },
];

export const defaultSoftware: DependencyDescriptor[] = [
  {
    name: 'npm.9.8.1',
    version: '9.8.1',
    category: 'tool',
    type: 'development',
    source: 'npm',
    scope: 'global',
    resolution: { method: 'import', path: '/usr/bin/npm' },
    usage: { usageContext: 'cli' },
    platformCompatibility: {
      languages: ['JavaScript', 'Node.js'],
      os: ['Linux', 'Windows', 'macOS'],
    },
    security: { isSecure: true },
    dependencyMetadata: { description: 'Node package manager', license: 'MIT' },
  },
];

export function getSoftwareByName(
  input: string | string[],
  softwareData: DependencyDescriptor[],
): DependencyDescriptor[] {
  // Ensure input is always an array
  const names = Array.isArray(input) ? input : [input];
  const result: DependencyDescriptor[] = [];

  names.forEach((name) => {
    // Find the software by name
    const software = softwareData.find((item) => item.name === name);

    // Add the found software or defaultSoftware if not found
    if (software) {
      if (!result.some((item) => item.name === software.name)) {
        result.push(software);
      }
    } else {
      const defaultSoftwareItem = defaultSoftware[0]; // Use the first default software
      if (!result.some((item) => item.name === defaultSoftwareItem.name)) {
        result.push(defaultSoftwareItem);
      }
    }
  });

  return result;
}
