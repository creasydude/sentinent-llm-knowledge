import { NextRequest } from 'next/server';
import { getPgPool, ensureSchema } from '@/lib/pg';
import { getDataSource } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    if (process.env.DATABASE_URL) {
      const pool = getPgPool();
      await ensureSchema();
      const { rows } = await pool.query('SELECT NOW() as now');
      return new Response(JSON.stringify({ status: 'ok', driver: 'pg', now: rows[0].now }), { headers: { 'Content-Type': 'application/json' } });
    } else {
      return new Response(JSON.stringify({ status: 'ok', driver: 'dev' }), { headers: { 'Content-Type': 'application/json' } });
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ status: 'error', message: e?.message || String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
