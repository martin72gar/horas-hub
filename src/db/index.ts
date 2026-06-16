import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

if (typeof globalThis.WebSocket === 'undefined') {
  const ws = require('ws');
  neonConfig.webSocketConstructor = ws.default || ws;
}

// We use the Pool driver (WebSockets) instead of neon-http to support transactions (db.transaction)
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgres://dummy:dummy@dummy/dummy" });
export const db = drizzle({ client: pool, schema });
