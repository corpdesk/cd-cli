// import type { LanguageDescriptor } from './dev-descriptor.model';

import { CdFxReturn } from '../../base/i-base.js';
import type { BaseDescriptor } from './base-descriptor.model.js';

// export interface LanguageDescriptor extends BaseDescriptor {
//   name: string; // Name of the language
//   version: string; // Current version
//   releaseDate?: string; // Release date of the current or first version
//   type: 'interpreted' | 'compiled' | 'hybrid' | 'unknown'; // Type of language

//   languageEcosystem: LanguageEcosystem;
//   languageParadigms: LanguageParadigms;
//   languageTooling: LanguageTooling;
//   languageFeatures: LanguageFeatures;
//   languageMiscellaneous: LanguageMiscellaneous;
// }

/**
 * Generic Language Descriptor System
 * Supports minimal usage (just name + .ts) and enriched multi-stage modeling
 */

export interface LanguageDescriptor extends BaseDescriptor {
  name: LanguageName; // Required: given name (e.g., "TypeScript", "C++", "Python"). C
  version?: string; // Optional: version (e.g., "5.0", "C++20")
  releaseDate?: string; // Optional: first/current release date
  type?: 'interpreted' | 'compiled' | 'hybrid' | 'unknown';

  // --- Core usage driver ---
  fileProfiles: LanguageFileProfile[]; // Required: must know at least one extension

  // --- Optional enrichment ---
  languageEcosystem?: LanguageEcosystem;
  languageParadigms?: LanguageParadigms;
  languageTooling?: LanguageTooling;
  languageFeatures?: LanguageFeatures;
  languageMiscellaneous?: LanguageMiscellaneous;
}

/**
 * Describes how files are represented in a given language ecosystem
 */
export interface LanguageFileProfile extends BaseDescriptor {
  profileName?: string; // Optional: e.g., "typeScriptSource", "cppHeader"
  extension: string; // e.g. ".ts", ".js", ".cpp", ".h"
  stage?: 'source' | 'transpiled' | 'compiled' | 'intermediate' | 'executable';
  standard?: string; // e.g., "ECMAScript 6", "C++20"
  tooling?: string[]; // Tooling relevant for this stage (["tsc", "babel"])
  notes?: string; // Additional context/usage notes
}

/**
 * Language Ecosystem
 */
export interface LanguageEcosystem extends BaseDescriptor {
  defaultPackageManager?: string; // e.g., "npm", "conan"
  frameworks?: string[]; // Popular frameworks/libraries
  community?: {
    size?: number; // Estimated community size
    forums?: string[]; // Community links/resources
  };
}

/**
 * Language Paradigms (programming style support)
 */
export interface LanguageParadigms extends BaseDescriptor {
  supportsOOP?: boolean;
  supportsFunctional?: boolean;
  supportsProcedural?: boolean;
  supportsLogic?: boolean;
  supportsConcurrent?: boolean;
}

/**
 * Tooling ecosystem
 */
export interface LanguageTooling extends BaseDescriptor {
  buildTools?: string[];
  testingFrameworks?: string[];
  linters?: string[];
  debuggers?: string[];
  packageManagers?: string[];
}

/**
 * Language Features
 */
export interface LanguageFeatures extends BaseDescriptor {
  staticTyping?: boolean;
  dynamicTyping?: boolean;
  memoryManagement?: 'garbageCollection' | 'manual' | 'other' | 'unknown';
  platformSupport?: string[]; // e.g., ["server", "mobile", "desktop"]
  interoperability?: string[]; // e.g., ["WebAssembly", "Java"]
}

/**
 * Miscellaneous descriptors
 */
export interface LanguageMiscellaneous extends BaseDescriptor {
  documentationStyle?: string; // e.g., "JSDoc", "Doxygen"
  useCases?: string[]; // e.g., ["Web apps", "System programming"]
  fileExtensions?: string[]; // Legacy/extra extensions, if needed
}

export enum LanguageName {
  TypeScript = 'TypeScript',
  Cpp = 'C++',
  Python = 'Python',
  JavaScript = 'JavaScript',
  Java = 'Java',
  Go = 'Go',
  Rust = 'Rust',
  Ruby = 'Ruby',
  PHP = 'PHP',
  CSharp = 'C#',
}

export const languages: LanguageDescriptor[] = [
  {
    name: LanguageName.TypeScript,
    version: '5.0',
    type: 'hybrid',
    fileProfiles: [
      { profileName: 'tsSource', extension: '.ts', stage: 'source', standard: 'ECMAScript 6+', tooling: ['tsc'] },
      { profileName: 'tsCompiled', extension: '.js', stage: 'transpiled', standard: 'ECMAScript 6+', tooling: ['node'] },
    ],
    languageEcosystem: {
      defaultPackageManager: 'npm',
      frameworks: ['Angular', 'NestJS', 'React'],
    },
    languageParadigms: { supportsOOP: true, supportsFunctional: true },
    languageTooling: {
      buildTools: ['webpack', 'tsc'],
      testingFrameworks: ['jest'],
      linters: ['eslint'],
    },
    languageFeatures: {
      staticTyping: true,
      dynamicTyping: false,
      memoryManagement: 'garbageCollection',
    },
  },
  {
    name: LanguageName.Cpp,
    version: 'C++20',
    type: 'compiled',
    fileProfiles: [
      { profileName: 'cppSource', extension: '.cpp', stage: 'source', standard: 'C++20', tooling: ['g++'] },
      { profileName: 'hSource', extension: '.h', stage: 'source', standard: 'C++20' },
      { profileName: 'oBinary', extension: '.o', stage: 'intermediate', tooling: ['ld'] },
      { profileName: 'execBin', extension: '.exe', stage: 'executable' },
    ],
    languageEcosystem: { defaultPackageManager: 'conan' },
    languageParadigms: { supportsOOP: true, supportsProcedural: true, supportsConcurrent: true },
    languageFeatures: { staticTyping: true, memoryManagement: 'manual' },
  },
];

export const defaultLanguage: LanguageDescriptor = {
  name: LanguageName.TypeScript,
  fileProfiles: [{ extension: '.ts', stage: 'source', standard: 'ECMAScript 6+' }],
};



export function getLanguageByName(
  name: LanguageName,
  languages: LanguageDescriptor[],
): LanguageDescriptor {
  return languages.find((language) => language.name === name) || defaultLanguage;
}

/**
 * Extracts a file extension for a given language name and profile.
 * @param name - The language name (enum LanguageName).
 * @param languages - The array of LanguageDescriptor objects.
 * @param fileProfileName - The profileName to search within the language's fileProfiles.
 * @returns CdFxReturn<string | null> - The extension if found, otherwise null.
 */
export function getExtensionByLangProfile(
  name: LanguageName,
  languages: LanguageDescriptor[],
  fileProfileName: string
): CdFxReturn<string | null> {
  const lang = languages.find(l => l.name === name);
  if (!lang) {
    return { state: false, data: null, message: `Language ${name} not found.` };
  }

  const profile = lang.fileProfiles.find(fp => fp.profileName === fileProfileName);
  if (!profile) {
    return { state: false, data: null, message: `Profile ${fileProfileName} not found for language ${name}.` };
  }

  return { state: true, data: profile.extension, message: 'Extension retrieved successfully.' };
}
