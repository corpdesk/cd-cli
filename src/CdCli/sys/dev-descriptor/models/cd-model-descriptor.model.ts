import type { BaseDescriptor } from './base-descriptor.model.js';
import { ComponentDescriptor, ComponentType } from './component-descriptor.model.js';
import type { DependencyDescriptor } from './dependancy-descriptor.model.js';
import { AccountCredentials } from './service-provider.model.js';

export interface CdModelDescriptor extends ComponentDescriptor {
  module?: string; // The module to which this model belongs
  parentModule?: string; // Parent module (if part of a hierarchical structure)
  type: ComponentType.Model | ComponentType.ModelType | ComponentType.ModelView;
  parentController?: string; // Parent model (if part of a hierarchical structure)
  fileName?: string; // File name where the model is defined
  tableName?: string; // Database table name
  relationships?: RelationshipDescriptor[]; // Model relationships
  fields: FieldDescriptor[]; // Fields of the model
  primaryKey?: string[];
  ormMapping?: OrmMappingDescriptor; // ORM mapping details
}

export interface FieldDescriptor extends BaseDescriptor {
  name: string; // logical name
  dbName?: string | FieldType; // actual DB column name
  type: string; // now uses our FieldType system
  required?: boolean;
  defaultValue?: any;
  nullable?: boolean;
  unique?: boolean;
  validation?: ValidationDescriptor;
  primary?: boolean;
  autoIncrement?: boolean;
  default?: boolean;
  length?: number;
  unsigned?: boolean;
}

// Validation Descriptor
export interface ValidationDescriptor extends BaseDescriptor {
  pattern?: string; // Regex pattern for validation
  maxLength?: number; // Maximum length of the field
  minLength?: number; // Minimum length of the field
  custom?: string; // Custom validation logic or reference
}


export interface RelationshipDescriptor extends BaseDescriptor {
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many' | 'foreign-key'; // Relationship type
  relatedModel?: string; // Name of the related model
  foreignKey?: string; // Key used for the relationship
  onDelete?: boolean;
  onUpdate?: boolean;
  sourceColumns: FieldDescriptor[];
  targetColumns: FieldDescriptor[];
  sourceTable?: string;
  targetTable?: string;
}

export interface IndexDescriptor extends BaseDescriptor {
  name: string; // Index name
  columns: string[]; // Columns in the index
  unique?: boolean; // Is it a UNIQUE index?
  type?: 'btree' | 'hash' | 'fulltext' | 'spatial'; // Optional, useful for MySQL/Postgres
}

// ORM Mapping Descriptor
export interface OrmMappingDescriptor {
  tableName: string; // Physical table or collection name in the database
  primaryKey: string[]; // Primary key field
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

export interface MigrationInstruction {
  type: 'createTable' | 'alterTable' | 'dropTable';
  tableName: string;
  columns: FieldDescriptor[];
  relations?: RelationshipDescriptor[];
}

export interface DatabaseSchemaDescriptor {
  name: string; // Logical name, e.g., "corpdesk_main"
  databaseName: string; // Physical DB name
  description?: string; // Optional description
  version?: string; // Schema version (for migrations)
  metadata?: Record<string, any>; // Arbitrary metadata

  // Models that define the schema
  models: CdModelDescriptor[];

  // Derived migration instructions
  migrations?: MigrationInstruction[];
}

// field-types.ts
export class FieldType {
  constructor(
    public readonly family: string, // logical type family, e.g. "int", "string"
    public readonly dialect: string, // dialect/vendor, e.g. "mysql"
    public readonly native: string, // actual type, e.g. "INT", "VARCHAR(255)"
    public readonly options: Record<string, any> = {}, // e.g. length, precision
  ) {}
}

// Namespace-like convenience
export const f = {
  mysql: {
    int: new FieldType('int', 'mysql', 'INT'),
    bigint: new FieldType('bigint', 'mysql', 'BIGINT'),
    varchar: (len = 255) => new FieldType('string', 'mysql', `VARCHAR(${len})`, { len }),
    text: new FieldType('text', 'mysql', 'TEXT'),
    boolean: new FieldType('boolean', 'mysql', 'TINYINT(1)'),
    uuid: new FieldType('uuid', 'mysql', 'CHAR(36)'),
    datetime: new FieldType('date', 'mysql', 'DATETIME'),
  },
  pg: {
    int: new FieldType('int', 'pg', 'INTEGER'),
    varchar: (len = 255) => new FieldType('string', 'pg', `VARCHAR(${len})`, { len }),
    uuid: new FieldType('uuid', 'pg', 'UUID'),
    boolean: new FieldType('boolean', 'pg', 'BOOLEAN'),
    text: new FieldType('text', 'pg', 'TEXT'),
    timestamp: new FieldType('date', 'pg', 'TIMESTAMP'),
  },
  js: {
    number: new FieldType('number', 'js', 'number'),
    string: new FieldType('string', 'js', 'string'),
    boolean: new FieldType('boolean', 'js', 'boolean'),
    date: new FieldType('date', 'js', 'Date'),
  },
};

// export interface MigrationProfile {
//   id: string;
//   source: CdDataSource;
//   destination: CdDataSource;
//   transformation: {
//     type: 'create' | 'alter' | 'drop' | 'sync' | 'custom';
//     target: 'table' | 'column' | 'relation' | 'index' | 'data';
//     descriptor?: any;
//     sql?: string;
//   };
//   description?: string;
// }
export interface MigrationProfile {
  id: string;
  source: CdDataSource;
  destination: CdDataSource;
  transformation: {
    type: 'create' | 'alter' | 'drop' | 'sync' | 'custom';
    target: 'table' | 'view' | 'column' | 'relation' | 'index' | 'data'; // 👈 add 'view'
    descriptor?: any;
    sql?: string;
  };
  description?: string;
  relations?: RelationshipDescriptor[]; // 👈 add relations for views
}

export interface CdDataSource extends BaseDescriptor {
  type: 'model' | 'database' | 'backup' | 'snapshot' | 'custom';
  dsConfig: DataSourceConfig;
  dsSchema?: DataSourceSchema; // optional, because not all sources expose schema
}

export interface DataSourceSchema extends BaseDescriptor {
  database?: string; // logical DB/schema name
  version?: string; // optional version (useful for diffs/migrations)
  tables?: TableDescriptor[]; // for relational
  collections?: CollectionDescriptor[]; // for NoSQL
  files?: FileDescriptor[]; // for backups/snapshots/custom
  metadata?: Record<string, any>; // free-form annotations
}

// export interface TableDescriptor extends BaseDescriptor {
//   name: string;
//   fields: FieldDescriptor[];
//   primaryKey?: string[]; // allow composite PKs
//   indexes?: IndexDescriptor[];
//   relations?: RelationshipDescriptor[];
//   engine?: string; // MySQL/MariaDB engines (InnoDB/MyISAM), optional
//   charset?: string; // table charset, optional
// }
export interface TableDescriptor {
  name: string;
  tableName?: string; // actual DB table name if different
  kind: 'table' | 'view'; // 👈 NEW
  fields?: FieldDescriptor[];
  indexes?: IndexDescriptor[];
  relations?: RelationshipDescriptor[];
  definitionSQL?: string; 
}

export interface CollectionDescriptor extends BaseDescriptor {
  name: string;
  fields: FieldDescriptor[];
  indexes?: IndexDescriptor[];
  shardKey?: string[]; // optional for Mongo/NoSQL sharding
}

export interface FileDescriptor extends BaseDescriptor {
  path: string;
  format: 'sql' | 'json' | 'csv' | 'xml' | 'binary' | 'other';
  size?: string;
  checksum?: string; // optional integrity check (MD5/SHA256)
}

export interface IndexDescriptor extends BaseDescriptor {
  name: string;
  fields?: string[];
  unique?: boolean;
  type?: 'btree' | 'hash' | 'fulltext' | 'spatial' | undefined; // optional, SQL/NoSQL
}

export interface DataSourceConfig extends BaseDescriptor {
  credentials?: AccountCredentials; // Reuse existing interface
  resourceAccess?: {
    path?: string; // File path for models, dumps, backups
    connectionString?: string; // DB connection string
    networkAccess?: {
      host?: string;
      port?: number;
      ipAddress?: string;
      uri?: string;
    };
  };
  dialect?: 'mysql' | 'postgres' | 'mongodb' | 'json' | 'csv' | 'typeorm' | 'unknown';

  options?: Record<string, any>; // Catch-all for tool- or provider-specific overrides
}
