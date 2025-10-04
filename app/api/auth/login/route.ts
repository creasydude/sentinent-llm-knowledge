import { getDataSource } from '@/lib/db';
import { UserSchema as User } from '@/server/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email || typeof email !== 'string') {
    return new Response(JSON.stringify({ message: 'Invalid email' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);

  let user = await userRepo.findOne({ where: { email } });
  if (!user) {
    user = userRepo.create({ email });
  }

  const staticAdminEmail = process.env.ADMIN_TEST_EMAIL;
  const staticAdminOtp = process.env.ADMIN_TEST_OTP;
  const isStaticAdmin = staticAdminEmail && staticAdminOtp && email.toLowerCase() === staticAdminEmail.toLowerCase();
  const otp = isStaticAdmin ? staticAdminOtp : generateOtp();
  const hashed = await bcrypt.hash(otp, 10);
  user.otp = hashed;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await userRepo.save(user);

  const port = Number(process.env.EMAIL_PORT || '587');
  const secure = (process.env.EMAIL_SECURE || '').toLowerCase() === 'true';
  const requireTLS = (process.env.EMAIL_REQUIRE_TLS || 'true').toLowerCase() === 'true';
  const skipAdminEmail = (process.env.ADMIN_TEST_SKIP_EMAIL || 'true').toLowerCase() === 'true';
  const allowSelfSigned = (process.env.EMAIL_ALLOW_SELF_SIGNED || 'false').toLowerCase() === 'true';
  const connectionTimeout = Number(process.env.EMAIL_CONNECTION_TIMEOUT || '10000');
  const socketTimeout = Number(process.env.EMAIL_SOCKET_TIMEOUT || '10000');
  // Sanitize EMAIL_HOST in case a port was included (e.g., "host:465")
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
  if (isStaticAdmin && skipAdminEmail) {
    // Skip sending email for static admin to make testing easier
    return new Response(JSON.stringify({ message: 'Static OTP generated for admin test user' }), { headers: { 'Content-Type': 'application/json' } });
  }

  // reuse port/secure computed above
  try {
    const transporter = nodemailer.createTransport({
      host,
      port: effectivePort,
      secure,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      ...(secure ? {} : (requireTLS ? { requireTLS: true } : {})),
      connectionTimeout,
      socketTimeout,
      tls: allowSelfSigned ? { rejectUnauthorized: false } : undefined,
    });
    // Fail fast if SMTP is unreachable
    await transporter.verify();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"LLM-Knowledge" <no-reply@example.com>',
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
