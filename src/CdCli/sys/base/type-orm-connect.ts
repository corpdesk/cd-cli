import { DataSource } from 'typeorm';
import config from '../../../config.js';

const CONNECTION_NAME = process.env.DB_MS_CONN_NAME || 'default';

export const AppDataSource = new DataSource({
    name: CONNECTION_NAME,
    ...config.db, // Ensure this contains all required TypeORM options
    synchronize: false, // Set to true only in development
    migrationsRun: true, // Ensures migrations run automatically
});

export class TypeOrmDatasource {
    private dataSource: DataSource;

    constructor() {
        this.dataSource = AppDataSource;
    }

    async getConnection(): Promise<DataSource> {
        if (!this.dataSource.isInitialized) {
            await this.dataSource.initialize();
        }
        return this.dataSource;
    }

    handleError(e: any) {
        console.error('Db::handleError()/e:', e);
    }
}