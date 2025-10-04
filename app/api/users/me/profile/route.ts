import { getDataSource } from '@/lib/db';
import { getPgPool } from '@/lib/pg';
import { UserSchema as User } from '@/server/schemas/user.schema';
import jwt from 'jsonwebtoken';

export async function GET(req: Request) {
  const auth = (req.headers as any).get?.('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecret') as any;
    let user: any;
    if (process.env.DATABASE_URL) {
      const pg = getPgPool();
      const { rows } = await pg.query('SELECT * FROM "user" WHERE id=$1', [payload.sub]);
      user = rows[0];
      if (!user) throw new Error('Not found');
    } else {
      const ds = await getDataSource();
      const userRepo = ds.getRepository(User);
      user = await userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new Error('Not found');
    }

    // Reset daily count if a new day has started (for accurate display)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isProd = !!process.env.DATABASE_URL;
    let dailyAnswerCount = isProd ? ((user as any).daily_answer_count ?? 0) : ((user as any).dailyAnswerCount ?? 0);
    const last = isProd ? ((user as any).last_answer_date ? new Date((user as any).last_answer_date) : null) : ((user as any).lastAnswerDate ? new Date((user as any).lastAnswerDate) : null);
    if (last) {
      const lastDay = new Date(last);
      lastDay.setHours(0, 0, 0, 0);
      if (lastDay.getTime() !== today.getTime() && dailyAnswerCount !== 0) {
        if (isProd) {
          const pg = getPgPool();
          await pg.query('UPDATE "user" SET daily_answer_count=0 WHERE id=$1', [user.id]);
        } else {
          const ds = await getDataSource();
          const userRepo = ds.getRepository(User);
          await userRepo.update(user.id, { dailyAnswerCount: 0 });
        }
        dailyAnswerCount = 0;
      }
    }

    if (process.env.DATABASE_URL) {
      return new Response(
        JSON.stringify({
          id: user.id,
          email: user.email,
          points: user.points ?? 0,
          isAdmin: !!user.is_admin,
          dailyAnswerCount,
          lastAnswerDate: user.last_answer_date ?? null,
        }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    } else {
      return new Response(
        JSON.stringify({
          id: user.id,
          email: (user as any).email,
          points: (user as any).points ?? 0,
          isAdmin: !!(user as any).isAdmin,
          dailyAnswerCount,
          lastAnswerDate: (user as any).lastAnswerDate ?? null,
        }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }
  } catch (e) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
}
