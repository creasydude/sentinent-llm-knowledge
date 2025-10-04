import { getDataSource } from '@/lib/db';
import { UserSchema as User } from '@/server/schemas/user.schema';
import jwt from 'jsonwebtoken';

export async function GET(req: Request) {
  const auth = (req.headers as any).get?.('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecret') as any;
    const ds = await getDataSource();
    const userRepo = ds.getRepository(User);
    const user = await userRepo.findOne({ where: { id: payload.sub } });
    if (!user) throw new Error('Not found');

    // Reset daily count if a new day has started (for accurate display)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let dailyAnswerCount = (user as any).dailyAnswerCount ?? 0;
    const last = (user as any).lastAnswerDate ? new Date((user as any).lastAnswerDate) : null;
    if (last) {
      const lastDay = new Date(last);
      lastDay.setHours(0, 0, 0, 0);
      if (lastDay.getTime() !== today.getTime() && dailyAnswerCount !== 0) {
        await userRepo.update(user.id, { dailyAnswerCount: 0 });
        dailyAnswerCount = 0;
      }
    }

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
  } catch (e) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
}
