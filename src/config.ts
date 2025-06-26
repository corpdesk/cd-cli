import type { ISessResp } from './CdCli/sys/base/IBase.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
/* eslint-disable node/prefer-global/process */
import path, { join } from 'node:path';
import { DataSource, DataSourceOptions } from 'typeorm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const CONFIG_FILE_PATH = join(
  process.env.HOME || '~/',
  '.cd-cli/cd-cli.profiles.json',
);

export const DEFAULT_SESS: ISessResp = {
  jwt: null,
  ttl: 300,
};

/**
 * this section needs to be automated.
 * the automation should be integrated during installation of given module
 * both front end and backend should be considered in installation process of given module.
 */
const ENTITIES = [
  __dirname + '/CdApi/sys/user/models/*.model.ts',
  __dirname + '/CdApi/sys/moduleman/models/*.model.ts',
  __dirname + '/CdApi/sys/comm/models/*.model.ts',
  __dirname + '/CdApi/sys/scheduler/models/*.model.ts',
  __dirname + '/CdApi/sys/cd-dev/models/*.model.ts',
  __dirname + '/CdApi/app/cd-accts/models/*.model.ts',
  __dirname + '/CdApi/app/coops/models/*.model.ts',
  __dirname + '/CdApi/app/cd-geo/models/*.model.ts',
];

export const AppDataSource = new DataSource({
  name: 'conn2',
  type: 'mysql',
  port: Number(process.env.DB_PORT),
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PWD,
  synchronize: false,
  // entities: [UserModel],
  entities: ENTITIES,
  migrations: [],
  subscribers: [],
  // logging: false,
  logging: [
    'query',
    // 'error',
    // 'schema',
    // 'warn',
    // 'info',
    // 'log'
  ],
});

// const mysqlConfig = {
//   name: 'default',
//   type: 'mysql',
//   port: process.env.DB_PORT,
//   host: process.env.DB_HOST,
//   username: process.env.DB_USER,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PWD,
//   // keepConnectionAlive: true,
//   entities: ENTITIES,
//   /**
//    * LOGGING OPTIONS
//    * query - logs all queries.
//    * error - logs all failed queries and errors.
//    * schema - logs the schema build process.
//    * warn - logs internal orm warnings.
//    * info - logs internal orm informative messages.
//    * log - logs internal orm log messages.
//    */
//   // logging: [
//   //     'query',
//   //     // 'error',
//   //     // 'schema',
//   //     // 'warn',
//   //     // 'info',
//   //     // 'log'
//   // ],
//   logging: ['query', 'error', 'warn', 'log'],
//   // logging: "all"
// };

const mysqlConfig: DataSourceOptions = {
  name: 'default',
  type: 'mysql', // Ensures TypeORM understands it's MySQL and not Aurora MySQL
  port: parseInt(process.env.DB_PORT || '3306', 10), // Ensure port is a number
  host: process.env.DB_HOST || 'localhost', // Provide defaults if undefined
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PWD || '',
  database: process.env.DB_NAME || 'test',
  entities: ENTITIES,
  logging: ['query', 'error', 'warn', 'log'],
};

const mysqlConfig2 = {
  type: 'mysql',
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PWD,
  synchronize: true,
  entities: ENTITIES,
  migrations: [],
  subscribers: [],
  // logging: false,
  logging: [
    'query',
    // 'error',
    // 'schema',
    // 'warn',
    // 'info',
    // 'log'
  ],
};

const sqliteConfig: DataSourceOptions = {
  name: 'default',
  type: 'sqlite', // Ensures TypeORM understands it's MySQL and not Aurora MySQL
  database: __dirname + '/database.sqlite',
  synchronize: false,
  entities: ENTITIES,
  logging: ['query', 'error', 'warn', 'log'],
};

export async function sqliteConfigFx(connName:any): Promise<any> {
  return {
    name: connName,
    type: 'sqlite',
    database: __dirname + '/database.sqlite',
    synchronize: false,
    // keepConnectionAlive: true,
    logging: false,
    entities: ENTITIES,
  };
}

// config.cdApiLocal
export default {
  ds: {
    sqlite: new DataSource(sqliteConfig),
    mysql: new DataSource(mysqlConfig),
  },
  db: mysqlConfig,
  db2: mysqlConfig2,
  sqliteConfigFx: sqliteConfigFx,
  cdApiLocal: 'cd-api-local',
  cdGitConfig: 'cd-git-config',
  cdSession: DEFAULT_SESS,
  meta: {
    name: 'cd-cli',
    version: '1.0.0',
    description: 'Your description here',
    showHelpAfterError: true,
  },
  preferences: {
    encryption: {
      encryptionKey: process.env.CD_CLI_ENCRYPT_KEY,
    },
    backUp: [
      {
        profileName: 'cd-git-config',
        field: 'details.gitAccess.gitHubToken',
        useLocal: { state: false, storePath: '~/.cd-cli/' },
        useWeb3: { state: false }, // yet to be defined
        useCloud: { state: false }, // yet to be defined
      },
    ],
  },
  back4app: {
    url: process.env.B4A_URL,
    appId: process.env.X_Parse_Application_Id,
    apiKey: process.env.X_Parse_REST_API_Key,
  },
  ////////////////////////////////////////
  usePush: true,
  usePolling: true,
  useCacheStore: true,
  cacheTtl: process.env.CACHE_TTL,
  emailUsers: [
    {
      name: 'ASDAP',
      email: process.env.EMAIL_ADDRESS,
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    },
  ],
  cdApi: {
    endpoint: 'https://localhost:3001/api',
    serverHost: 'localhost',
    serverPort: '3001',
    entryPoint: '/api',
  },
  push: {
    mode: process.env.PUSH_MODE,
    serverHost: 'https://146.190.165.51',
    serverPort: process.env.SIO_PORT,
    redisHost: process.env.REDIS_HOST,
    redisPort: process.env.REDIS_PORT,
    /**
     * for redis-adapter cluster
     */
    startupNodes: [
      {
        port: 6380,
        host: process.env.REDIS_HOST,
      },
      {
        port: 6381,
        host: '146.190.157.42',
      },
    ],
    /**
     * for redis-adapter sentinel
     */
    sentinalOptions: {
      sentinels: [
        { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT) },
        { host: 'asdap.net', port: Number(process.env.REDIS_PORT) },
      ],
      name: 'master01',
    },
  },
};

export let AllowModelSyncing = false;

export function enableModelSyncing() {
  AllowModelSyncing = true;
}

export function disableModelSyncing() {
  AllowModelSyncing = false;
}

export function mailConfig(username: string, password: string) {
  return {
    mailService: 'cloudmailin',
    host: 'zohomail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: username,
      pass: password,
    },
    logger: true,
  };
}
