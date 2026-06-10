import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

let db: ReturnType<typeof drizzle> | null = null;

export function getDb(url?: string) {
  if (db) return db;
  const connectionString =
    url || process.env.DATABASE_URL || "postgresql://localhost:5432/agentforge";
  const client = postgres(connectionString);
  db = drizzle(client, { schema });
  return db;
}

export async function closeDb() {
  if (!db) return;
  const client = (db as any).client as postgres.Sql;
  await client.end();
  db = null;
}
