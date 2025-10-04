import { getPgPool } from '@/lib/pg';
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
  const pg = getPgPool();
  const { rows } = await pg.query('SELECT * FROM "user" WHERE id=$1', [decoded.sub]);
  const user = rows[0];
  if (!user || !user.refresh_token || !user.refresh_token_expires_at) {
    return new Response(JSON.stringify({ message: 'Invalid refresh token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (new Date() > new Date(user.refresh_token_expires_at)) {
    return new Response(JSON.stringify({ message: 'Refresh token expired' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const ok = await bcrypt.compare(refreshToken, user.refresh_token);
  if (!ok) {
    return new Response(JSON.stringify({ message: 'Invalid refresh token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const accessToken = jwt.sign({ sub: user.id, email: user.email, isAdmin: !!user.is_admin }, jwtSecret, { expiresIn: '15m' });
  const newRefreshToken = jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
  const rtExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pg.query('UPDATE "user" SET refresh_token=$2, refresh_token_expires_at=$3 WHERE id=$1', [user.id, await bcrypt.hash(newRefreshToken, 10), rtExpires]);
  return new Response(JSON.stringify({ accessToken, refreshToken: newRefreshToken }), { headers: { 'Content-Type': 'application/json' } });
}
