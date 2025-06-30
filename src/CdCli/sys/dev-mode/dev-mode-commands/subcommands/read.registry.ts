import { ICdRequest } from '../../../../sys/base/index.js';

export interface ICdReadRequest {
  flag: string;
  label: string;
  description: string;
  required: string[];
  cdRequest: ICdRequest;
}

export const readItemRegistry: ICdReadRequest[] = [
  {
    flag: 'test-bed',
    label: 'Test-Bed Environment',
    description: 'Read a developer test-bed environment',
    required: ['name', 'type'],
    cdRequest: {
      ctx: 'app',
      m: 'cd-ai',
      c: 'CdAiModule',
      a: 'readTestBed',
      dat: { f_vals: [{ data: null }], token: null },
      args: null,
    },
  },
  {
    flag: 'prod',
    label: 'Production Deployment',
    description: 'Read production environment info',
    required: ['name', 'type'],
    cdRequest: {
      ctx: 'app',
      m: 'cd-ai',
      c: 'CdAiModule',
      a: 'readProd',
      dat: { f_vals: [{ data: null }], token: null },
      args: null,
    },
  },
  // ... sandbox, package etc.
];
