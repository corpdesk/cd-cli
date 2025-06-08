// import type { LanguageDescriptor } from './dev-descriptor.model';

import type { BaseDescriptor } from './base-descriptor.model.js';

export interface LanguageDescriptor extends BaseDescriptor {
  name: string; // Name of the language
  version: string; // Current version
  releaseDate?: string; // Release date of the current or first version
  type: 'interpreted' | 'compiled' | 'hybrid' | 'unknown'; // Type of language

  languageEcosystem: LanguageEcosystem;
  languageParadigms: LanguageParadigms;
  languageTooling: LanguageTooling;
  languageFeatures: LanguageFeatures;
  languageMiscellaneous: LanguageMiscellaneous;
}

export interface LanguageEcosystem extends BaseDescriptor {
  defaultPackageManager?: string; // Primary package manager
  frameworks?: string[]; // List of popular frameworks/libraries
  community?: {
    size?: number; // Estimated community size
    forums?: string[]; // URLs to forums or resources
  };
}

export interface LanguageParadigms extends BaseDescriptor {
  supportsOOP: boolean; // Supports Object-Oriented Programming
  supportsFunctional: boolean; // Supports Functional Programming
  supportsProcedural: boolean; // Supports Procedural Programming
}

export interface LanguageTooling extends BaseDescriptor {
  buildTools?: string[]; // Common build tools
  testingFrameworks?: string[]; // Testing frameworks
  linters?: string[]; // Linters for code quality
  debuggers?: string[]; // Debugging tools
}

export interface LanguageFeatures extends BaseDescriptor {
  staticTyping: boolean; // Static typing support
  dynamicTyping: boolean; // Dynamic typing support
  memoryManagement: 'garbageCollection' | 'manual' | 'other' | 'unknown'; // Memory management type
  platformSupport: string[]; // Supported platforms (e.g., server, mobile, etc.)
  interoperability?: string[]; // Supported languages/productions for interop
}

export interface LanguageMiscellaneous extends BaseDescriptor {
  documentationStyle?: string; // Preferred documentation tool or style
  fileExtensions?: string[]; // File extensions associated with the language
  useCases?: string[]; // Typical use cases for the language
}

export const languages: LanguageDescriptor[] = [
  {
    name: 'JavaScript',
    version: 'ES2022',
    releaseDate: '2022-06-01',
    type: 'interpreted',
    languageEcosystem: {
      defaultPackageManager: 'npm',
      frameworks: ['React', 'Angular', 'Vue'],
      community: {
        size: 2000000,
        forums: ['https://stackoverflow.com', 'https://dev.to'],
      },
    },
    languageParadigms: {
      supportsOOP: true,
      supportsFunctional: true,
      supportsProcedural: true,
    },
    languageTooling: {
      buildTools: ['Webpack', 'Parcel', 'Rollup'],
      testingFrameworks: ['Jest', 'Mocha', 'Jasmine'],
      linters: ['ESLint', 'JSHint'],
      debuggers: ['Chrome DevTools', 'Node.js Inspector'],
    },
    languageFeatures: {
      staticTyping: false,
      dynamicTyping: true,
      memoryManagement: 'garbageCollection',
      platformSupport: ['server', 'browser', 'mobile'],
      interoperability: ['Node.js', 'Deno'],
    },
    languageMiscellaneous: {
      documentationStyle: 'JSDoc',
      fileExtensions: ['.js', '.mjs'],
      useCases: ['web development', 'server-side applications'],
    },
  },
  {
    name: 'Python',
    version: '3.11',
    releaseDate: '2022-10-03',
    type: 'interpreted',
    languageEcosystem: {
      defaultPackageManager: 'pip',
      frameworks: ['Django', 'Flask', 'FastAPI'],
      community: {
        size: 1500000,
        forums: ['https://python.org', 'https://reddit.com/r/python'],
      },
    },
    languageParadigms: {
      supportsOOP: true,
      supportsFunctional: true,
      supportsProcedural: true,
    },
    languageTooling: {
      buildTools: ['PyInstaller', 'Setuptools'],
      testingFrameworks: ['unittest', 'pytest', 'nose'],
      linters: ['Pylint', 'flake8'],
      debuggers: ['PDB', 'PyCharm Debugger'],
    },
    languageFeatures: {
      staticTyping: true,
      dynamicTyping: true,
      memoryManagement: 'garbageCollection',
      platformSupport: ['server', 'desktop', 'scientific computing'],
      interoperability: ['C', 'Java'],
    },
    languageMiscellaneous: {
      documentationStyle: 'Sphinx',
      fileExtensions: ['.py'],
      useCases: ['data science', 'web development', 'automation'],
    },
  },
  {
    name: 'C++',
    version: '20',
    releaseDate: '2020-12-15',
    type: 'compiled',
    languageEcosystem: {
      defaultPackageManager: 'vcpkg',
      frameworks: ['Qt', 'Boost'],
      community: {
        size: 800000,
        forums: ['https://cplusplus.com', 'https://stackoverflow.com'],
      },
    },
    languageParadigms: {
      supportsOOP: true,
      supportsFunctional: true,
      supportsProcedural: true,
    },
    languageTooling: {
      buildTools: ['CMake', 'Make'],
      testingFrameworks: ['Google Test', 'Catch2'],
      linters: ['Cppcheck', 'Clang-Tidy'],
      debuggers: ['GDB', 'LLDB'],
    },
    languageFeatures: {
      staticTyping: true,
      dynamicTyping: false,
      memoryManagement: 'manual',
      platformSupport: ['server', 'desktop', 'embedded'],
      interoperability: ['C', 'Python'],
    },
    languageMiscellaneous: {
      documentationStyle: 'Doxygen',
      fileExtensions: ['.cpp', '.h', '.hpp'],
      useCases: ['game development', 'system software', 'embedded systems'],
    },
  },
  {
    name: 'Go',
    version: '1.21',
    releaseDate: '2023-08-01',
    type: 'compiled',
    languageEcosystem: {
      defaultPackageManager: 'go modules',
      frameworks: ['Gin', 'Echo', 'Beego'],
      community: {
        size: 500000,
        forums: ['https://golang.org', 'https://golangweekly.com'],
      },
    },
    languageParadigms: {
      supportsOOP: false,
      supportsFunctional: false,
      supportsProcedural: true,
    },
    languageTooling: {
      buildTools: ['Go Build'],
      testingFrameworks: ['Go Test'],
      linters: ['Golint'],
      debuggers: ['Delve'],
    },
    languageFeatures: {
      staticTyping: true,
      dynamicTyping: false,
      memoryManagement: 'garbageCollection',
      platformSupport: ['server', 'cloud'],
      interoperability: ['C'],
    },
    languageMiscellaneous: {
      documentationStyle: 'Godoc',
      fileExtensions: ['.go'],
      useCases: ['cloud computing', 'microservices', 'network programming'],
    },
  },
];

export const defaultLanguage: LanguageDescriptor = {
  name: 'Unknown',
  version: 'N/A',
  type: 'interpreted',
  languageEcosystem: {
    defaultPackageManager: 'N/A',
    frameworks: [],
    community: {
      size: 0,
      forums: [],
    },
  },
  languageParadigms: {
    supportsOOP: false,
    supportsFunctional: false,
    supportsProcedural: false,
  },
  languageTooling: {
    buildTools: [],
    testingFrameworks: [],
    linters: [],
    debuggers: [],
  },
  languageFeatures: {
    staticTyping: false,
    dynamicTyping: false,
    memoryManagement: 'other',
    platformSupport: [],
    interoperability: [],
  },
  languageMiscellaneous: {
    documentationStyle: 'N/A',
    fileExtensions: [],
    useCases: [],
  },
};

export function getLanguageByName(
  name: string,
  languages: LanguageDescriptor[],
): LanguageDescriptor {
  return (
    languages.find((language) => language.name === name) || defaultLanguage
  );
}
