import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DatabaseConfig, DatabaseConnection } from '../database.type';


export class PostgreSQLProvider implements DatabaseConnection {
  private pool: Pool;
  private db: NodePgDatabase;

  constructor(private config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
    });

    this.db = drizzle(this.pool);
  }

  async connect(): Promise<NodePgDatabase> {
    const client = await this.pool.connect();
    client.release();
    return this.db;
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  getClient(): NodePgDatabase {
    return this.db;
  }
}