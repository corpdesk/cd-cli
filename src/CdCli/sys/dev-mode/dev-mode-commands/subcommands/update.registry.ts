import { ICdRequest } from '../../../base/index.js';

export interface ICdUpdateRequest {
  flag: string;
  label: string;
  description: string;
  required: string[];
  cdRequest: ICdRequest;
}

export const updateItemRegistry: ICdUpdateRequest[] = [
  {
    flag: 'test-bed',
    label: 'Test-Bed Environment',
    description: 'Update a developer test-bed environment',
    required: ['name', 'type'],
    cdRequest: {
      ctx: 'app',
      m: 'cd-ai',
      c: 'CdAiModule',
      a: 'updateTestBed',
      dat: { f_vals: [{ data: null }], token: null },
      args: null,
    },
  },
  {
    flag: 'prod',
    label: 'Production Deployment',
    description: 'Update production environment info',
    required: ['name', 'type'],
    cdRequest: {
      ctx: 'app',
      m: 'cd-ai',
      c: 'CdAiModule',
      a: 'updateProd',
      dat: { f_vals: [{ data: null }], token: null },
      args: null,
    },
  },
  // ... sandbox, package etc.
];
