// cd-assert-utils.ts

import { CdAssertReturn, CdFxStateLevel } from "../base/i-base.js";


// ─── Assertion Evaluator ──────────────────────────
export function isAssertSuccessful(result: CdAssertReturn): boolean {
  return result.data === true &&
    [CdFxStateLevel.Success, CdFxStateLevel.PartialSuccess].includes(result.state as CdFxStateLevel);
}

// ─── Type Guard ───────────────────────────────────
export function isCdFxReturnBoolean(obj: any): obj is CdAssertReturn {
  return obj && typeof obj === 'object' &&
    typeof obj.data === 'boolean' &&
    typeof obj.state !== 'undefined';
}

// ─── Assertion Runner Utility ─────────────────────
export async function runAssert(fn: () => Promise<CdAssertReturn>): Promise<boolean> {
  const result = await fn();
  if (!isCdFxReturnBoolean(result)) {
    throw new Error('Invalid assertion result format.');
  }
  return isAssertSuccessful(result);
}


