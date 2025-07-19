import { DataSource } from "typeorm";
import { loadEntityPaths } from "./config.js";
// import { loadEntityPaths } from "./config";

const AppDataSource = new DataSource({
  name: "conn2",
  type: "mysql",
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
  logging: [
    "query",
    'error',
    'schema',
    'warn',
    'info',
    'log'
  ],
});

AppDataSource.initialize()
  .then(() => {
    console.log("✅ Database schema synced.");
  })
  .catch((err) => {
    console.error("❌ Failed to sync database:", err);
  });
