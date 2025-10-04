import { getDataSource } from '@/lib/db';
import { getPgPool } from '@/lib/pg';
import { UserSchema as User } from '@/server/schemas/user.schema';
import jwt from 'jsonwebtoken';

export async function GET(req: Request) {
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
  if (process.env.DATABASE_URL) {
    const pg = getPgPool();
    const { rows } = await pg.query('SELECT * FROM "user"');
    const mapped = rows.map((u: any) => ({
      id: u.id,
      email: u.email,
      points: u.points ?? 0,
      isAdmin: !!u.is_admin,
    }));
    return new Response(JSON.stringify(mapped), { headers: { 'Content-Type': 'application/json' } });
  } else {
    const ds = await getDataSource();
    const users = await ds.getRepository(User).find();
    const mapped = users.map((u: any) => ({ id: u.id, email: u.email, points: u.points ?? 0, isAdmin: !!u.isAdmin }));
    return new Response(JSON.stringify(mapped), { headers: { 'Content-Type': 'application/json' } });
  }
}
