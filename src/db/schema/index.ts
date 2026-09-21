import { integer, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { member, user } from "./auth.schema";

export const parents = pgTable("parents", {
  id: uuid().primaryKey().notNull(),
  name: text('name').notNull(),
  memberId: text('member_id').notNull().references(() => member.id, { onDelete: 'cascade' }),
});

export const parents = pgTable("parents", {
  id: uuid().primaryKey().notNull(),
  name: text('name').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
});
