import type { BaseDescriptor } from './base-descriptor.model.js';

export interface TestingFrameworkDescriptor extends BaseDescriptor {
  type: 'unit' | 'integration' | 'end-to-end' | 'unknown'; // Type of testing it supports
  language?: string; // Programming language (e.g., JavaScript, Python, Java)
  tools?: string[]; // Tools or libraries it integrates with (e.g., Puppeteer, Selenium)
  testingFeatures?: TestingFeatures;
  popularityRank?: number; // An optional rank or popularity index
}

export interface TestingFeatures {
  assertions: boolean; // Supports assertions
  mocking: boolean; // Supports mocking/stubbing
  parallelExecution?: boolean; // Supports parallel test execution
  codeCoverage?: boolean; // Supports code coverage reporting
  customExtensions?: boolean; // Allows custom plugins/extensions
}

export const testingFrameworks: TestingFrameworkDescriptor[] = [
  {
    name: 'Jest',
    description:
      'A delightful JavaScript testing framework with a focus on simplicity.',
    type: 'unit',
    language: 'JavaScript',
    tools: ['Puppeteer'],
    testingFeatures: {
      assertions: true,
      mocking: true,
      parallelExecution: true,
      codeCoverage: true,
    },
    popularityRank: 1,
    context: ['cd-api', 'cd-api-dev-env', 'cd-cli'],
  },
  {
    name: 'Mocha',
    description:
      'A flexible JavaScript test framework for Node.js and the browser.',
    type: 'unit',
    language: 'JavaScript',
    tools: ['Chai', 'Sinon'],
    testingFeatures: {
      assertions: true,
      mocking: true,
      customExtensions: true,
    },
    popularityRank: 2,
    context: ['cd-api', 'cd-api-dev-env'],
  },
  {
    name: 'Cypress',
    description: 'An end-to-end testing framework built for the modern web.',
    type: 'end-to-end',
    language: 'JavaScript',
    tools: ['Cypress Dashboard'],
    testingFeatures: {
      assertions: true,
      mocking: true,
      parallelExecution: true,
    },
    popularityRank: 3,
    context: ['cd-ui'],
  },
  {
    name: 'JUnit',
    description: 'A widely used testing framework for Java applications.',
    type: 'unit',
    language: 'Java',
    tools: ['JUnit 5'],
    testingFeatures: {
      assertions: true,
      mocking: true,
      parallelExecution: true,
      codeCoverage: true,
    },
    popularityRank: 4,
    context: ['cd-backend'],
  },
];

export const defaultTestingFramework: TestingFrameworkDescriptor = {
  name: 'JUnit',
  description: 'A widely used testing framework for Java applications.',
  type: 'unit',
  language: 'Java',
  tools: ['JUnit 5'],
  testingFeatures: {
    assertions: true,
    mocking: true,
    parallelExecution: true,
    codeCoverage: true,
  },
  popularityRank: 4,
  context: ['cd-backend'],
};

/**
 * Usage:
 * const result = getTestingFramework(["Mocha", "Nonexistent Framework"], knownTestingFrameworks);
 * console.log(result);
 *
 * @param names
 * @param frameworks
 * @returns
 */
export function getTestingFramework(
  names: string[],
  frameworks: TestingFrameworkDescriptor[],
): TestingFrameworkDescriptor[] {
  return frameworks.filter(
    (framework) => framework.name && names.includes(framework.name),
  );
}

export function getTestingFrameworkByContext(
  context: string,
  frameworks: TestingFrameworkDescriptor[],
): TestingFrameworkDescriptor[] {
  return frameworks.filter(
    (framework) => framework.context && framework.context.includes(context),
  );
}
