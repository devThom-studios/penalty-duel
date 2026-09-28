import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable('rooms', {
  code:text('code').primaryKey(),
  hostToken:text('host_token').notNull(),
  guestToken:text('guest_token'),
  state:text('state').notNull(),
  revision:integer('revision').notNull().default(0),
  expires:integer('expires').notNull(),
});

export const penaltyRooms = sqliteTable('penalty_rooms', {
 code:text('code').primaryKey(), hostToken:text('host_token').notNull(),guestToken:text('guest_token'),
 state:text('state').notNull(),revision:integer('revision').notNull().default(0),expires:integer('expires').notNull(),
});
