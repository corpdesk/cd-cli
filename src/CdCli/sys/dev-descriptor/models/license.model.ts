// import type { ServiceCost } from './service.model';

import type { BaseDescriptor } from './base-descriptor.model.js';
import type { ServiceCost } from './service-descriptor.model.js';

// // LicenseDescriptor Definition
export interface LicenseDescriptor extends BaseDescriptor {
  type: 'openSource' | 'commercial' | 'custom';
  licenseName?: string; // For standard licenses (e.g., 'MIT', 'GPL-3.0', 'Apache-2.0')
  licenseLink?: string; // URL to the license text (for commercial or open source)
  terms?: string; // For custom licenses or additional terms
  cost?: ServiceCost;
}

// import type { LicenseDescriptor } from './app-descriptor.model';

// Example Licenses
export const mitLicense: LicenseDescriptor = {
  type: 'openSource',
  licenseName: 'MIT',
  licenseLink: 'https://opensource.org/licenses/MIT',
};

export const commercialLicense: LicenseDescriptor = {
  type: 'commercial',
  licenseLink: 'https://example.com/licenses/commercial-license',
  cost: {
    type: 'paid',
    amount: 1000,
    currency: 'USD',
  },
};

export const customLicense: LicenseDescriptor = {
  type: 'custom',
  terms:
    'This software is provided under a custom agreement. Contact us for details.',
};

// Default License
export const defaultLicense: LicenseDescriptor = {
  type: 'openSource',
  licenseName: 'Apache-2.0',
  licenseLink: 'https://opensource.org/licenses/Apache-2.0',
};

// Array of Licenses
export const licenses: LicenseDescriptor[] = [
  mitLicense,
  commercialLicense,
  customLicense,
  defaultLicense,
];

// Function to Get License by Name
export function getLicenseByName(
  name: string,
  licenses: LicenseDescriptor[],
): LicenseDescriptor {
  return (
    licenses.find(
      (license) => license.licenseName?.toLowerCase() === name.toLowerCase(),
    ) || defaultLicense
  );
}

// Example Usage
const selectedLicense = getLicenseByName('MIT', licenses);
console.log(selectedLicense);

const unknownLicense = getLicenseByName('Unknown License', licenses);
console.log(unknownLicense); // Returns defaultLicense
