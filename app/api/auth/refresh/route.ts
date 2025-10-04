import { getDataSource } from '@/lib/db';
import { UserSchema as User } from '@/server/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  const { refreshToken } = await req.json();
  if (!refreshToken || typeof refreshToken !== 'string') {
    return new Response(JSON.stringify({ message: 'Invalid request' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const jwtSecret = process.env.JWT_SECRET || 'supersecret';
  let decoded: any;
  try {
    decoded = jwt.verify(refreshToken, jwtSecret);
  } catch {
    return new Response(JSON.stringify({ message: 'Invalid or expired refresh token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const ds = await getDataSource();
  const repo = ds.getRepository(User);
  const user = await repo.findOne({ where: { id: decoded.sub } });
  if (!user || !user.refreshToken || !user.refreshTokenExpiresAt) {
    return new Response(JSON.stringify({ message: 'Invalid refresh token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (new Date() > user.refreshTokenExpiresAt) {
    return new Response(JSON.stringify({ message: 'Refresh token expired' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const ok = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!ok) {
    return new Response(JSON.stringify({ message: 'Invalid refresh token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const accessToken = jwt.sign({ sub: user.id, email: user.email, isAdmin: user.isAdmin }, jwtSecret, { expiresIn: '15m' });
  const newRefreshToken = jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
  user.refreshToken = await bcrypt.hash(newRefreshToken, 10);
  user.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await repo.save(user);
  return new Response(JSON.stringify({ accessToken, refreshToken: newRefreshToken }), { headers: { 'Content-Type': 'application/json' } });
}
