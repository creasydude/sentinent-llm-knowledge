import { getDataSource } from '@/lib/db';
import { getPgPool, ensureSchema } from '@/lib/pg';
import { randomUUID } from 'crypto';
import { UserSchema as User } from '@/server/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { MailtrapTransport } from 'mailtrap';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email || typeof email !== 'string') {
    return new Response(JSON.stringify({ message: 'Invalid email' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  let user: any;
  if (process.env.DATABASE_URL) {
    const pg = getPgPool();
    await ensureSchema();
    // Upsert user by email
    const { rows } = await pg.query('SELECT * FROM "user" WHERE email=$1', [email]);
    if (rows.length) {
      user = rows[0];
    } else {
      const id = randomUUID();
      const { rows: created } = await pg.query('INSERT INTO "user" (id, email) VALUES ($1, $2) RETURNING *', [id, email]);
      user = created[0];
    }
  } else {
    const ds = await getDataSource();
    const userRepo = ds.getRepository(User);
    user = await userRepo.findOne({ where: { email } });
    if (!user) {
      user = userRepo.create({ email });
    }
  }

  const staticAdminEmail = process.env.ADMIN_TEST_EMAIL;
  const staticAdminOtp = process.env.ADMIN_TEST_OTP;
  const isStaticAdmin = staticAdminEmail && staticAdminOtp && email.toLowerCase() === staticAdminEmail.toLowerCase();
  const otp = isStaticAdmin ? staticAdminOtp : generateOtp();
  const hashed = await bcrypt.hash(otp, 10);
  const expires = new Date(Date.now() + 10 * 60 * 1000);
  if (process.env.DATABASE_URL) {
    const pg = getPgPool();
    await pg.query('UPDATE "user" SET otp=$1, otp_expires_at=$2 WHERE email=$3', [hashed, expires, email]);
  } else {
    const ds = await getDataSource();
    const userRepo = ds.getRepository(User);
    user.otp = hashed;
    user.otpExpiresAt = expires;
    await userRepo.save(user);
  }

  const skipAdminEmail = (process.env.ADMIN_TEST_SKIP_EMAIL || 'true').toLowerCase() === 'true';
  const mailtrapToken = process.env.MAILTRAP_TOKEN;
  const useMailtrap = (process.env.USE_MAILTRAP || (mailtrapToken ? 'true' : 'false')).toLowerCase() === 'true';
  if (isStaticAdmin && skipAdminEmail) {
    // Skip sending email for static admin to make testing easier
    return new Response(JSON.stringify({ message: 'Static OTP generated for admin test user' }), { headers: { 'Content-Type': 'application/json' } });
  }

  try {
    let transporter: nodemailer.Transporter;
    if (useMailtrap) {
      if (!mailtrapToken) throw new Error('MAILTRAP_TOKEN not set');
      transporter = nodemailer.createTransport(MailtrapTransport({ token: mailtrapToken }));
    } else {
      const port = Number(process.env.EMAIL_PORT || '587');
      const secure = (process.env.EMAIL_SECURE || '').toLowerCase() === 'true';
      const requireTLS = (process.env.EMAIL_REQUIRE_TLS || 'true').toLowerCase() === 'true';
      const allowSelfSigned = (process.env.EMAIL_ALLOW_SELF_SIGNED || 'false').toLowerCase() === 'true';
      const connectionTimeout = Number(process.env.EMAIL_CONNECTION_TIMEOUT || '10000');
      const socketTimeout = Number(process.env.EMAIL_SOCKET_TIMEOUT || '10000');
      const rawHost = (process.env.EMAIL_HOST || '').trim();
      let host = rawHost;
      let hostPortFromHost: number | undefined = undefined;
      const idx = rawHost.lastIndexOf(':');
      if (idx > -1) {
        const maybePort = rawHost.slice(idx + 1);
        if (/^\d+$/.test(maybePort)) {
          host = rawHost.slice(0, idx);
          hostPortFromHost = Number(maybePort);
        }
      }
      const effectivePort = hostPortFromHost ?? port;
      transporter = nodemailer.createTransport({
        host,
        port: effectivePort,
        secure,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        ...(secure ? {} : (requireTLS ? { requireTLS: true } : {})),
        connectionTimeout,
        socketTimeout,
        tls: allowSelfSigned ? { rejectUnauthorized: false } : undefined,
      });
      await transporter.verify();
    }
    const fromAddress = process.env.MAILTRAP_SENDER_EMAIL || process.env.EMAIL_FROM;
    const fromName = process.env.MAILTRAP_SENDER_NAME || 'LLM-Knowledge';
    if (useMailtrap && !fromAddress) {
      throw new Error('MAILTRAP_SENDER_EMAIL not set');
    }
    await transporter.sendMail({
      from: fromAddress ? { address: fromAddress, name: fromName } : (process.env.EMAIL_FROM || 'no-reply@example.com'),
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
    });
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    return new Response(JSON.stringify({ message: 'Failed to send OTP email' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ message: 'OTP sent to your email' }), { headers: { 'Content-Type': 'application/json' } });
}
