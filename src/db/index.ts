import { Pool, neon, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

if (typeof globalThis.WebSocket === 'undefined') {
  const ws = require('ws');
  neonConfig.webSocketConstructor = ws.default || ws;
}

const connectionString = process.env.DATABASE_URL || "postgres://dummy:dummy@dummy/dummy";

// Use Neon HTTP for request-time reads. It is stateless and behaves better for
// aborted Edge/RSC navigations than a global WebSocket pool.
const sql = neon(connectionString);
export const db = drizzleHttp(sql, { schema });

// Use the Pool driver only where interactive transactions are required.
const pool = new Pool({ connectionString });
export const transactionDb = drizzlePool({ client: pool, schema });
