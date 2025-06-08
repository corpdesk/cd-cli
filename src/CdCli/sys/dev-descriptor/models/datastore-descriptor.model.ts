/* eslint-disable style/indent */
import type { EnvironmentDescriptor } from './/environment.model.js';
// import type { BaseDescriptor } from './app-descriptor.model';
import type { BaseDescriptor } from './base-descriptor.model.js';

// Main Descriptor Interface
export interface DataStoreDescriptor extends DataStoreTypeDescriptor {
  environment?: EnvironmentDescriptor;
  productionEnvironment?: EnvironmentDescriptor;

  dataStoreSchema?: DataStoreSchemaDescriptor;
  dataStoreReplicationConfig?: DataStoreReplicationConfig;
  dataStoreBackupConfig?: DataStoreBackupConfig;
  dataStoreFilesConfig?: DataStoreFilesConfig;
  dataStorePerformance?: DataStorePerformance;
  dataStoreMetadata?: DataStoreMetadata;
}

// Data Store Type Descriptor
export interface DataStoreTypeDescriptor extends BaseDescriptor {
  type:
    | 'relational'
    | 'nosql'
    | 'object-storage'
    | 'file-system'
    | 'in-memory'
    | 'distributed'
    | 'unknown'; // Type of data store
  version?: string; // Version of the system
}

// Data Store Schema Descriptor
export interface DataStoreSchemaDescriptor extends BaseDescriptor {
  database?: string; // Name of the database/schema (for relational databases)
  tableMappings?: Record<string, string>; // Logical to physical table mappings
  collections?: string[]; // Collections (for NoSQL databases)
  buckets?: string[]; // Buckets (for object storage)
}

// Replication Configuration
export interface ReplicaDescriptor extends BaseDescriptor {
  host: string; // Host of the replica
  port?: number; // Port of the replica
}

export interface DataStoreReplicationConfig extends BaseDescriptor {
  enabled: boolean; // Whether replication is enabled
  type?: 'master-slave' | 'multi-master' | 'sharded' | 'custom' | 'unknown'; // Replication type
  replicas?: ReplicaDescriptor[]; // Array of replicas
}

// Backup Configuration
export interface DataStoreBackupConfig extends BaseDescriptor {
  enabled: boolean; // Whether backups are enabled
  schedule?: string; // Cron-like backup schedule
  retention?: string; // Retention policy
  location?: string; // Backup storage location
}

// File Storage Configuration
export interface DataStoreFilesConfig extends BaseDescriptor {
  maxSize?: string; // Maximum storage size
  autoScaling?: boolean; // Whether storage auto-scales
  storageClass?: 'standard' | 'reduced-redundancy' | 'archive'; // Storage class
}

// Performance Configuration
export interface CacheConfig extends BaseDescriptor {
  enabled: boolean; // Whether caching is enabled
  type?: 'in-memory' | 'distributed'; // Cache type
  size?: string; // Cache size
}

export interface IndexingConfig extends BaseDescriptor {
  enabled: boolean; // Whether indexing is enabled
  fields?: string[]; // Indexed fields
}

export interface DataStorePerformance extends BaseDescriptor {
  maxConnections?: number; // Max connections allowed
  cache?: CacheConfig; // Caching configuration
  indexing?: IndexingConfig; // Indexing configuration
}

// Metadata Configuration
export interface DataStoreMetadata extends BaseDescriptor {
  description?: string; // Description of the data store
  owner?: string; // Owner or administrator
  tags?: string[]; // Tags for categorization
  createdAt?: string; // Creation timestamp
  lastModified?: string; // Last modification timestamp
}
