import { getPgPool } from '@/lib/pg';
import jwt from 'jsonwebtoken';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = (req.headers as any).get?.('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  let payload: any;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
  } catch {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (!payload.isAdmin) return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  const pg = getPgPool();
  await pg.query('UPDATE "user" SET is_admin=false WHERE id=$1', [params.id]);
  return new Response(JSON.stringify({ message: 'User demoted' }), { headers: { 'Content-Type': 'application/json' } });
}
