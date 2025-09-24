import { DatabaseConfig, DatabaseConnection, DatabaseDialect } from './database.type';
import { PostgreSQLProvider } from './providers/postgresql.provider';


export class DatabaseFactory {
  static createConnection(
    dialect: DatabaseDialect, 
    config: DatabaseConfig
  ): DatabaseConnection {
    switch (dialect) {
      case 'postgresql':
        return new PostgreSQLProvider(config);
      default:
        throw new Error(`Unsupported database dialect: ${dialect}`);
    }
  }
}