import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { CdObjModel } from '../../CdCli/sys/moduleman/models/cd-obj.model.js';
import { CdObjTypeModel } from '../../CdCli/sys/moduleman/models/cd-obj-type.model.js';

// Load environment variables
// dotenv.config();

const mysqlDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [CdObjModel, CdObjTypeModel],
  synchronize: false, // Change to 'true' if you want TypeORM to auto-sync schema
});

(async () => {
  try {
    await mysqlDataSource.initialize();
    console.log('✅ Connected to MySQL');

    const recordsCdObj = await mysqlDataSource.getRepository(CdObjModel).find();
    fs.writeFileSync('cd_obj.json', JSON.stringify(recordsCdObj, null, 2));
    console.log('✅ CdObj data exported!');

    const recordsCdObjType = await mysqlDataSource
      .getRepository(CdObjTypeModel)
      .find();
    fs.writeFileSync(
      'cd_obj_type.json',
      JSON.stringify(recordsCdObjType, null, 2),
    );
    console.log('✅ CdObjType data exported!');

    await mysqlDataSource.destroy();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
})();
