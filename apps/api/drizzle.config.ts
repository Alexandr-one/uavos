import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';
import { join } from 'path';

const envPath = join(__dirname, '../../.env');
config({ path: envPath });

const dialect = (process.env.DB_DIALECT || 'postgresql') as 'postgresql' | 'mysql' | 'sqlite';

const baseConfig = {
  schema: './src/database/schemas/postgresql.schema.ts',
  out: './drizzle',
  dialect: dialect,
};

const dialectConfigs = {
  postgresql: {
    ...baseConfig,
    dbCredentials: {
      url: process.env.DATABASE_URL || 
           `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
    },
  },
};

export default dialectConfigs[dialect] satisfies Config;