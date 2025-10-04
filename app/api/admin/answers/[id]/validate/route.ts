import { getDataSource } from '@/lib/db';
import { AnswerSchema as Answer } from '@/server/schemas/answer.schema';
import { UserSchema as User } from '@/server/schemas/user.schema';
import { PointSchema as Point } from '@/server/schemas/point.schema';
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
  const answerRepo = ds.getRepository(Answer);
  const userRepo = ds.getRepository(User);
  const pointsRepo = ds.getRepository(Point);
  const answer = await answerRepo.findOne({ where: { id: params.id }, relations: ['user'] });
  if (!answer) return new Response(JSON.stringify({ message: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  if (!answer.isGoodAnswer) {
    answer.isGoodAnswer = true;
    await answerRepo.save(answer);
    const user = answer.user;
    await userRepo.update(user.id, { points: user.points + 10 });
    const pointTx = pointsRepo.create({ user, points: 10, reason: 'Good Answer' });
    await pointsRepo.save(pointTx);
  }
  return new Response(JSON.stringify({ message: 'Answer validated and points awarded.' }), { headers: { 'Content-Type': 'application/json' } });
}
