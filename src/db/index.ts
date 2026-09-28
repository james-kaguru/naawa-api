import 'dotenv/config';


import { drizzle } from 'drizzle-orm/node-postgres';
import { dbRelations } from './schema/index.ts';
import { authRelations } from './schema/auth.schema.ts';

export const db = drizzle(process.env.DATABASE_URL!, {
  relations: { ...authRelations, ...dbRelations }
});

export type Db = typeof db;
