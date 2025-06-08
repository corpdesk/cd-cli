import type { BaseDescriptor } from './base-descriptor.model.js';

export interface MigrationDescriptor extends BaseDescriptor {
  migrationTool?:
    | 'sequelize'
    | 'typeorm'
    | 'prisma'
    | 'custom'
    | 'unknown'
    | 'unknown'; // Tool used for migrations
  migrationScriptsPath?: string; // Path to migration SQL/scripts (relative to repo root)
  dumpFilePath?: string; // Path to SQL dump file for fresh DB setup
  importCommand?: string; // Command to execute the migration (e.g., `mysql -u root -p < dump.sql`)
  rollbackCommand?: string; // Command to revert last migration
  environmentVariables?: Record<string, string>; // Any env vars required during migration
  seedScripts?: string[]; // Optional scripts to populate the DB after migration
}
