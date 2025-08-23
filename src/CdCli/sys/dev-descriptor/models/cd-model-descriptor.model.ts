import type { BaseDescriptor } from './base-descriptor.model.js';
import { ComponentDescriptor, ComponentType } from './component-descriptor.model.js';
import type { DependencyDescriptor } from './dependancy-descriptor.model.js';


export interface CdModelDescriptor  extends ComponentDescriptor  {
  module?: string; // The module to which this model belongs
  parentModule?: string; // Parent module (if part of a hierarchical structure)
  type: ComponentType.Model | ComponentType.ModelType | ComponentType.ModelView;
  parentController?: string; // Parent model (if part of a hierarchical structure)
  fileName?: string; // File name where the model is defined
  tableName?: string; // Database table name
  relationships?: RelationshipDescriptor[]; // Model relationships
  fields: FieldDescriptor[]; // Fields of the model
  ormMapping?: OrmMappingDescriptor; // ORM mapping details
}

// Base Field Descriptor
export interface FieldDescriptor extends BaseDescriptor {
  name: string; // Field name
  dbName?: string; // Database column name (if different from field name)
  type: any; // Data type of the field
  required: boolean; // Indicates if the field is mandatory
  defaultValue?: any; // Default value for the field
  unique?: boolean; // Indicates if the field value must be unique
  validation?: ValidationDescriptor; // Field validation rules
  default: boolean; // Indicates if the field is a default export
}

// Validation Descriptor
export interface ValidationDescriptor extends BaseDescriptor {
  pattern?: string; // Regex pattern for validation
  maxLength?: number; // Maximum length of the field
  minLength?: number; // Minimum length of the field
  custom?: string; // Custom validation logic or reference
}

// Relationship Descriptor
export interface RelationshipDescriptor extends BaseDescriptor {
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'; // Relationship type
  relatedModel: string; // Name of the related model
  foreignKey?: string; // Key used for the relationship
}

// ORM Mapping Descriptor
export interface OrmMappingDescriptor {
  tableName: string; // Physical table or collection name in the database
  primaryKey: string; // Primary key field
  indexes?: string[]; // List of indexed fields
  uniqueConstraints?: string[]; // List of fields with unique constraints
  ormOptions?: OrmOptionsDescriptor; // Additional ORM-specific options
}

// ORM Options Descriptor
export interface OrmOptionsDescriptor {
  cascade?: boolean; // Enable cascading operations
  eagerLoading?: boolean; // Enable eager loading of relationships
  discriminatorColumn?: string; // Column used for inheritance in the table
}
