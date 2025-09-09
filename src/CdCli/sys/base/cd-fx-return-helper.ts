import { CdFxStateLevel, FxStateMeta, FxStateSemantics } from "./i-base.js";

// Overloads for direct state checks
export function isSuccess(state: boolean | CdFxStateLevel): boolean {
  return state === true || state === CdFxStateLevel.Success;
}

export function isPartialSuccess(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.PartialSuccess;
}

export function isLogicalFailure(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.LogicalFailure;
}

export function isWarning(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.Warning;
}

export function isRecoverable(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.Recoverable;
}

export function isInfo(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.Info;
}

export function isPending(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.Pending;
}

export function isCancelled(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.Cancelled;
}

export function isNotFound(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.NotFound;
}

export function isNotImplemented(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.NotImplemented;
}

export function isSystemError(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.SystemError;
}

export function isFatal(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.Fatal;
}

export function isUnknown(state: boolean | CdFxStateLevel): boolean {
  return state === CdFxStateLevel.Unknown;
}

export function isFailure(state: boolean | CdFxStateLevel): boolean {
  return (
    state === false || state === CdFxStateLevel.Fatal || isRecoverable(state)
  );
}

export function getStateLevel(state: boolean | CdFxStateLevel): CdFxStateLevel {
  if (state === true) return CdFxStateLevel.Success;
  if (state === false) return CdFxStateLevel.Fatal;
  return state;
}

export function interpretFxState(state: boolean | CdFxStateLevel, semantics: FxStateSemantics): FxStateMeta {
  if (typeof state === 'boolean') {
    return state ? semantics.mapping['Success'] : semantics.mapping['Error'];
  }
  return semantics.mapping[CdFxStateLevel[state] as keyof typeof semantics.mapping];
}

