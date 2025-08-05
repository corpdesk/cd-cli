import { DataSource } from 'typeorm';
import { loadEntityPaths } from './config.js';
import * as dotenv from 'dotenv';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions.js';
dotenv.config();
const mysqlConfig = {
  name: 'conn2',
  type: 'mysql',
  port: Number(process.env.DB_MS_PORT),
  host: process.env.DB_MS_HOST,
  username: process.env.DB_MS_USER,
  database: process.env.DB_MS_NAME,
  password: process.env.DB_MS_PWD,
  synchronize: true,
  // entities: [UserModel],
  entities: loadEntityPaths(), // this reads from module-entities.json,
  migrations: [],
  subscribers: [],
  // logging: false,
  logging: ['query', 'error', 'schema', 'warn', 'info', 'log'],
};

const AppDataSource = new DataSource(mysqlConfig as MysqlConnectionOptions);
AppDataSource.initialize()
  .then(async () => {
    console.log('✅ Database schema synced.');

    // Optional: wait a short moment if any logs are pending
    await new Promise((res) => setTimeout(res, 100));

    // 🧼 Close connections properly
    await AppDataSource.destroy();

    // ✅ Force exit (even though destroy() should be enough)
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Failed to sync database:', err);
    process.exit(1); // 🚨 Exit with error
  });
