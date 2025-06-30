import { ICdRequest } from "../../../../sys/base/index.js";

export interface ICdMigrateRequest {
  flag: string;
  label: string;
  description: string;
  required: string[];
  cdRequest: ICdRequest;
  enabled?: boolean;
}

export const migrateItemRegistry: ICdMigrateRequest[] = [
  {
    flag: "test-bed",
    label: "Test Bed",
    description: "Migrate a developer test-bed environment",
    required: ["name", "type"],
    cdRequest: {
      ctx: "app",
      m: "mod-craft",
      c: "TestBed",
      a: "migrate",
      dat: {
        f_vals: [{ data: null }],
        token: "", // injected at runtime
      },
      args: null, // to be filled with actual { name, type } later
    }
  },
  {
    flag: "module",
    label: "Module",
    description: "Migrate a new Corpdesk module",
    required: ["name", "type"],
    cdRequest: {
      ctx: "app",
      m: "mod-craft",
      c: "CdModule",
      a: "migrate",
      dat: {
        f_vals: [{ data: null }],
        token: "", // injected later
      },
      args: null
    }
  }
];
