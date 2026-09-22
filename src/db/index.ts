import 'dotenv/config';


import { drizzle } from 'drizzle-orm/node-postgres';
import { authRelations } from './schema/auth.schema.ts';
import { dbRelations } from './schema/index.ts';

export const db = drizzle(process.env.DATABASE_URL!, {
  relations: { ...authRelations, ...dbRelations }
});
