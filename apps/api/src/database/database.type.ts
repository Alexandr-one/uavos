export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  }
  
  export interface DatabaseConnection {
    connect(): Promise<any>;
    disconnect(): Promise<void>;
    getClient(): any;
  }
  
  export type DatabaseDialect = 'postgresql' | 'mysql' | 'sqlite';