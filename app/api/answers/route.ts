import { getDataSource } from '@/lib/db';
import { getPgPool } from '@/lib/pg';
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

  let user: any;
  if (process.env.DATABASE_URL) {
    const pg = getPgPool();
    const { rows } = await pg.query('SELECT * FROM "user" WHERE id=$1', [payload.sub]);
    user = rows[0];
  } else {
    const ds = await getDataSource();
    const userRepo = ds.getRepository(User);
    user = await userRepo.findOne({ where: { id: payload.sub } });
  }
  if (!user) return new Response(JSON.stringify({ message: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  if (!answerText.trim()) return new Response(JSON.stringify({ message: 'Answer text cannot be empty' }), { status: 403, headers: { 'Content-Type': 'application/json' } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isProd = !!process.env.DATABASE_URL;
  const lastDateRaw = isProd ? (user as any).last_answer_date : (user as any).lastAnswerDate;
  const lastDate = lastDateRaw ? new Date(lastDateRaw) : null;
  let dailyCount = isProd ? ((user as any).daily_answer_count ?? 0) : ((user as any).dailyAnswerCount ?? 0);
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

  let question: any;
  if (process.env.DATABASE_URL) {
    const pg = getPgPool();
    const { rows } = await pg.query('SELECT * FROM question WHERE id=$1', [questionId]);
    question = rows[0];
  } else {
    const ds = await getDataSource();
    const questionRepo = ds.getRepository(Question);
    question = await questionRepo.findOne({ where: { id: questionId } });
  }
  if (!question) return new Response(JSON.stringify({ message: 'Question not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

  let existingAnswers: any[] = [];
  if (process.env.DATABASE_URL) {
    const pg = getPgPool();
    const { rows } = await pg.query('SELECT text FROM answer WHERE question_id=$1', [questionId]);
    existingAnswers = rows;
  } else {
    const ds = await getDataSource();
    const answerRepo = ds.getRepository(Answer);
    existingAnswers = await answerRepo.find({ where: { question: { id: questionId } }, relations: ['question', 'user'] });
  }
  for (const ex of existingAnswers) {
    if (compareTwoStrings(ex.text, answerText) > 0.8) {
      // Duplicate answer: treat as a bad request to avoid front-end mislabeling as daily limit
      return new Response(JSON.stringify({ message: 'Similar answer already submitted' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
  }

  if (process.env.DATABASE_URL) {
    const pg = getPgPool();
    const { rows } = await pg.query('INSERT INTO answer (id, text, question_id, user_id) VALUES (gen_random_uuid(), $1, $2, $3) RETURNING *', [answerText, questionId, user.id]);
    await pg.query('UPDATE "user" SET daily_answer_count=$2, last_answer_date=$3, points=$4 WHERE id=$1', [user.id, dailyCount + 1, new Date(), ((user as any).points ?? 0) + 10]);
    await pg.query('INSERT INTO point (id, points, user_id, reason) VALUES (gen_random_uuid(), 10, $1, $2)', [user.id, 'Answer Submission']);
    // Mark question as answered so the next fetch returns a new one
    await pg.query('UPDATE question SET is_answered=true WHERE id=$1', [questionId]);
    return new Response(JSON.stringify(rows[0]), { headers: { 'Content-Type': 'application/json' } });
  } else {
    const ds = await getDataSource();
    const userRepo = ds.getRepository(User);
    const answerRepo = ds.getRepository(Answer);
    const questionRepo = ds.getRepository(Question);
    const pointsRepo = ds.getRepository(Point);
    const newAnswer = answerRepo.create({ text: answerText, user, question });
    await answerRepo.save(newAnswer);
    await userRepo.update(user.id, { dailyAnswerCount: dailyCount + 1, lastAnswerDate: new Date(), points: ((user as any).points ?? 0) + 10 });
    const pointTx = pointsRepo.create({ user, points: 10, reason: 'Answer Submission' });
    await pointsRepo.save(pointTx);
    // Mark question as answered so the next fetch returns a new one
    (question as any).isAnswered = true;
    await questionRepo.save(question);
    return new Response(JSON.stringify(newAnswer), { headers: { 'Content-Type': 'application/json' } });
  }
}
