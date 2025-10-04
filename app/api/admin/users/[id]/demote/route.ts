import { getDataSource } from '@/lib/db';
import { UserSchema as User } from '@/server/schemas/user.schema';
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
  const ds = await getDataSource();
  const repo = ds.getRepository(User);
  await repo.update(params.id, { isAdmin: false });
  return new Response(JSON.stringify({ message: 'User demoted' }), { headers: { 'Content-Type': 'application/json' } });
}
