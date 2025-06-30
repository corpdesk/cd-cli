import { ICdRequest } from "../../../../sys/base/index.js";

export interface ICdDeleteRequest {
  flag: string;
  label: string;
  description: string;
  required: string[];
  cdRequest: ICdRequest;
  enabled?: boolean;
}

export const deleteItemRegistry: ICdDeleteRequest[] = [
  {
    flag: "test-bed",
    label: "Test Bed",
    description: "Delete a developer test-bed environment",
    required: ["name", "type"],
    cdRequest: {
      ctx: "app",
      m: "mod-craft",
      c: "TestBed",
      a: "delete",
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
    description: "Delete a new Corpdesk module",
    required: ["name", "type"],
    cdRequest: {
      ctx: "app",
      m: "mod-craft",
      c: "CdModule",
      a: "delete",
      dat: {
        f_vals: [{ data: null }],
        token: "", // injected later
      },
      args: null
    }
  }
];
