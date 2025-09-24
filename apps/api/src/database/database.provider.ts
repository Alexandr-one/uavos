import { Provider } from '@nestjs/common';
import { DatabaseFactory } from './database.factory';
import { DatabaseConfig, DatabaseDialect } from './database.type';

export const databaseProvider: Provider = {
  provide: 'DATABASE_CONNECTION',
  useFactory: async (): Promise<any> => {
    const dbConfig: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'uavos',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'root',
    };

    const dialect = (process.env.DB_DIALECT || 'postgresql') as DatabaseDialect;
    const connection = DatabaseFactory.createConnection(dialect, dbConfig);
    
    return await connection.connect();
  },
};