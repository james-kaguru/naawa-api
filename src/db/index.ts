import 'dotenv/config';


import { drizzle } from 'drizzle-orm/node-postgres';
import { dbRelations } from './schema/index.ts';

export const db = drizzle(process.env.DATABASE_URL!, {
  relations: dbRelations
});

export type Db = typeof db;
