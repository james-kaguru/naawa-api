import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const attendances = pgTable("attendances", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});
