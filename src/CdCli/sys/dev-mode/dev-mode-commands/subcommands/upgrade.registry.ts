import { ICdRequest } from "../../../../sys/base/index.js";

export interface ICdUpgradeRequest {
  flag: string;
  label: string;
  description: string;
  required: string[];
  cdRequest: ICdRequest;
  enabled?: boolean;
}

export const upgradeItemRegistry: ICdUpgradeRequest[] = [
  {
    flag: "test-bed",
    label: "Test Bed",
    description: "Upgrade a developer test-bed environment",
    required: ["name", "type"],
    cdRequest: {
      ctx: "app",
      m: "mod-craft",
      c: "TestBed",
      a: "upgrade",
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
    description: "Upgrade a new Corpdesk module",
    required: ["name", "type"],
    cdRequest: {
      ctx: "app",
      m: "mod-craft",
      c: "CdModule",
      a: "upgrade",
      dat: {
        f_vals: [{ data: null }],
        token: "", // injected later
      },
      args: null
    }
  }
];
