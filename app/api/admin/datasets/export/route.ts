import { getDataSource } from '@/lib/db';
import { getPgPool } from '@/lib/pg';
import { AnswerSchema as Answer } from '@/server/schemas/answer.schema';
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
    const { rows } = await pg.query('SELECT a.text as answer_text, q.text as question_text FROM answer a LEFT JOIN question q ON q.id=a.question_id WHERE a.is_good_answer=true');
    const dataset = rows.map((r: any) => ({ instruction: r.question_text, output: r.answer_text }));
    return new Response(JSON.stringify(dataset), {
      headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename=dataset.json' },
    });
  } else {
    const ds = await getDataSource();
    const goodAnswers = await ds.getRepository(Answer).find({ where: { isGoodAnswer: true }, relations: ['question'] });
    const dataset = goodAnswers.map((a) => ({ instruction: a.question.text, output: a.text }));
    return new Response(JSON.stringify(dataset), {
      headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename=dataset.json' },
    });
  }
}
