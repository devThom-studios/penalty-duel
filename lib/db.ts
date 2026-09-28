import { env } from 'cloudflare:workers';
export function getDB(): D1Database {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if(!db) throw new Error('The pitch is temporarily unavailable. Please try again.');
  return db.withSession('first-primary') as unknown as D1Database;
}
