// import { CdFxReturn, CdFxStateLevel } from "./cd-fx-types"; // adjust if needed

import { CdFxReturn, CdFxStateLevel } from "./i-base.js";

// ✅ Default returns for each CdFxStateLevel

export const CD_FX_SUCCESS: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Success,
  message: "Success!",
};

export const CD_FX_FAIL: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Error,
  message: "Failed!",
};

export const CD_FX_PARTIAL_SUCCESS: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.PartialSuccess,
  message: "Partial success.",
};

export const CD_FX_LOGICAL_FAILURE: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.LogicalFailure,
  message: "Logical failure.",
};

export const CD_FX_WARNING: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Warning,
  message: "Warning issued.",
};

export const CD_FX_RECOVERABLE: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Recoverable,
  message: "Recoverable state.",
};

export const CD_FX_INFO: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Info,
  message: "Informational message.",
};

export const CD_FX_PENDING: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Pending,
  message: "Pending operation.",
};

export const CD_FX_CANCELLED: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Cancelled,
  message: "Operation cancelled.",
};

export const CD_FX_NOT_FOUND: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.NotFound,
  message: "Not found.",
};

export const CD_FX_NOT_IMPLEMENTED: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.NotImplemented,
  message: "Not implemented yet.",
};

export const CD_FX_SYSTEM_ERROR: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.SystemError,
  message: "System-level error occurred.",
};

export const CD_FX_FATAL: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Fatal,
  message: "Fatal error.",
};

export const CD_FX_UNKNOWN: CdFxReturn<null> = {
  data: null,
  state: CdFxStateLevel.Unknown,
  message: "Unknown state or error.",
};

export function cdFx<T>(
  state: CdFxStateLevel,
  message: string,
  data: T | null = null
): CdFxReturn<T> {
  return { state, message, data };
}
