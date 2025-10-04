import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __schemaReady: boolean | undefined;
}

function shouldUseSSL(): boolean {
  const url = process.env.DATABASE_URL || '';
  if (/sslmode=require/i.test(url)) return true;
  return (process.env.DATABASE_SSL || '').toLowerCase() === 'true';
}

export function getPgPool(): Pool {
  if (global.__pgPool) return global.__pgPool;
  const useSSL = shouldUseSSL();
  global.__pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSSL ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.PG_POOL_MAX || '5'),
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT || '5000'),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT || '10000'),
  });
  return global.__pgPool;
}

export async function ensureSchema() {
  if (global.__schemaReady) return;
  const p = getPgPool();
  await p.query(`CREATE TABLE IF NOT EXISTS "user" (
    id uuid PRIMARY KEY,
    email text UNIQUE NOT NULL
  )`);
  await p.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS otp text`);
  await p.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS otp_expires_at timestamptz`);
  await p.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0`);
  await p.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS daily_answer_count integer NOT NULL DEFAULT 0`);
  await p.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS last_answer_date timestamptz`);
  await p.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS refresh_token text`);
  await p.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS refresh_token_expires_at timestamptz`);
  await p.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false`);

  await p.query(`CREATE TABLE IF NOT EXISTS question (
    id uuid PRIMARY KEY
  )`);
  await p.query(`ALTER TABLE question ADD COLUMN IF NOT EXISTS text text NOT NULL`);
  await p.query(`ALTER TABLE question ADD COLUMN IF NOT EXISTS topic text NOT NULL`);
  await p.query(`ALTER TABLE question ADD COLUMN IF NOT EXISTS is_answered boolean NOT NULL DEFAULT false`);

  await p.query(`CREATE TABLE IF NOT EXISTS answer (
    id uuid PRIMARY KEY
  )`);
  await p.query(`ALTER TABLE answer ADD COLUMN IF NOT EXISTS text text NOT NULL`);
  await p.query(`ALTER TABLE answer ADD COLUMN IF NOT EXISTS question_id uuid`);
  await p.query(`ALTER TABLE answer ADD COLUMN IF NOT EXISTS user_id uuid`);
  await p.query(`ALTER TABLE answer ADD COLUMN IF NOT EXISTS is_good_answer boolean NOT NULL DEFAULT false`);
  await p.query(`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'answer_question_fk') THEN
      ALTER TABLE answer ADD CONSTRAINT answer_question_fk FOREIGN KEY (question_id) REFERENCES question(id) ON DELETE CASCADE;
    END IF;
  END $$`);
  await p.query(`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'answer_user_fk') THEN
      ALTER TABLE answer ADD CONSTRAINT answer_user_fk FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
    END IF;
  END $$`);

  await p.query(`CREATE TABLE IF NOT EXISTS point (
    id uuid PRIMARY KEY
  )`);
  await p.query(`ALTER TABLE point ADD COLUMN IF NOT EXISTS points integer NOT NULL`);
  await p.query(`ALTER TABLE point ADD COLUMN IF NOT EXISTS user_id uuid`);
  await p.query(`ALTER TABLE point ADD COLUMN IF NOT EXISTS reason text NOT NULL`);
  await p.query(`ALTER TABLE point ADD COLUMN IF NOT EXISTS timestamp timestamptz NOT NULL DEFAULT NOW()`);
  await p.query(`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'point_user_fk') THEN
      ALTER TABLE point ADD CONSTRAINT point_user_fk FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
    END IF;
  END $$`);
  global.__schemaReady = true;
}
