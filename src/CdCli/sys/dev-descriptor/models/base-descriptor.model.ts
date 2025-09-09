import { CdFileDescriptor } from "./version-control.model.js";

// Base Descriptor for General Use
export interface BaseDescriptor {
  name?: string; // Unique identifier
  type?: any; // Type of descriptor,
  cdObjName?: string; // Name of the object, e.g., application, module, etc.
  cdObjTypeName?: string; // Type of the object, e.g., cd-api, cd-ui, etc.
  guid?: string; // Unique identifier for the descriptor, can be used to reference it in other contexts.
  description?: string;
  context?: string[]; // array of context assigned to a descriptor to group set associated descriptors and properties.
  // Could be name of application or profile name
  version?: string;
  fileMeta?: CdFileDescriptor;
  baseId?: string;         // Unique identifier, e.g., "mod-abc:doc"

}
