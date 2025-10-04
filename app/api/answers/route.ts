import { getDataSource } from '@/lib/db';
import { AnswerSchema as Answer } from '@/server/schemas/answer.schema';
import { QuestionSchema as Question } from '@/server/schemas/question.schema';
import { UserSchema as User } from '@/server/schemas/user.schema';
import { PointSchema as Point } from '@/server/schemas/point.schema';
import jwt from 'jsonwebtoken';
import { compareTwoStrings } from 'string-similarity';

export async function POST(req: Request) {
  const auth = (req.headers as any).get?.('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  const { questionId, answerText } = await req.json();
  if (!questionId || !answerText) return new Response(JSON.stringify({ message: 'Invalid request' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  let payload: any;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
  } catch {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);
  const questionRepo = ds.getRepository(Question);
  const answerRepo = ds.getRepository(Answer);
  const pointsRepo = ds.getRepository(Point);

  const user = await userRepo.findOne({ where: { id: payload.sub } });
  if (!user) return new Response(JSON.stringify({ message: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  if (!answerText.trim()) return new Response(JSON.stringify({ message: 'Answer text cannot be empty' }), { status: 403, headers: { 'Content-Type': 'application/json' } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = (user as any).lastAnswerDate ? new Date((user as any).lastAnswerDate) : null;
  let dailyCount = (user as any).dailyAnswerCount ?? 0;
  if (lastDate) {
    const lastDay = new Date(lastDate);
    lastDay.setHours(0, 0, 0, 0);
    if (lastDay.getTime() !== today.getTime()) {
      dailyCount = 0;
    }
  }
  if (dailyCount >= 5) {
    return new Response(JSON.stringify({ message: 'Daily answer limit reached' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  const question = await questionRepo.findOne({ where: { id: questionId } });
  if (!question) return new Response(JSON.stringify({ message: 'Question not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

  const existingAnswers = await answerRepo.find({ where: { question: { id: questionId } }, relations: ['question', 'user'] });
  for (const ex of existingAnswers) {
    if (compareTwoStrings(ex.text, answerText) > 0.8) {
      return new Response(JSON.stringify({ message: 'Similar answer already submitted' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
  }

  const newAnswer = answerRepo.create({ text: answerText, user, question });
  await answerRepo.save(newAnswer);

  await userRepo.update(user.id, { dailyAnswerCount: dailyCount + 1, lastAnswerDate: new Date(), points: ((user as any).points ?? 0) + 10 });
  const pointTx = pointsRepo.create({ user, points: 10, reason: 'Answer Submission' });
  await pointsRepo.save(pointTx);

  return new Response(JSON.stringify(newAnswer), { headers: { 'Content-Type': 'application/json' } });
}
