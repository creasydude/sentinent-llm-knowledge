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
    const { rows } = await pg.query('SELECT a.id, a.text, a.is_good_answer, q.id as qid, q.text as question_text, q.topic as question_topic, u.email as user_email FROM answer a LEFT JOIN question q ON q.id=a.question_id LEFT JOIN "user" u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 200');
    const mapped = rows.map((r: any) => ({
      id: r.id,
      text: r.text,
      question: { id: r.qid, text: r.question_text, topic: r.question_topic },
      userEmail: r.user_email,
      isGoodAnswer: !!r.is_good_answer,
    }));
    return new Response(JSON.stringify(mapped), { headers: { 'Content-Type': 'application/json' } });
  } else {
    const ds = await getDataSource();
    const answers = await ds.getRepository(Answer).find({ relations: ['question', 'user'] });
    const mapped = answers.map((a: any) => ({
      id: a.id,
      text: a.text,
      question: { id: a.question?.id, text: a.question?.text, topic: a.question?.topic },
      userEmail: a.user?.email,
      isGoodAnswer: !!a.isGoodAnswer,
    }));
    return new Response(JSON.stringify(mapped), { headers: { 'Content-Type': 'application/json' } });
  }
}
