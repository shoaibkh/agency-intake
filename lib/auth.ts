import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './db';
import { loginSchema } from './validators';

const COOKIE_NAME = 'agp_session';
const encoder = new TextEncoder();

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required.');
  return encoder.encode(secret);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'REVIEWER';
};

export async function signSession(user: SessionUser) {
  return new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      id: payload.sub ?? '',
      name: String(payload.name ?? ''),
      email: String(payload.email ?? ''),
      role: payload.role === 'ADMIN' ? 'ADMIN' : 'REVIEWER'
    };
  } catch {
    return null;
  }
}

export async function getSessionFromCookies() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession() {
  const session = await getSessionFromCookies();
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}

export async function loginUser(email: string, password: string) {
  const parsed = loginSchema.parse({ email, password });
  const user = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (!user) return null;

  const ok = await bcrypt.compare(parsed.password, user.passwordHash);
  if (!ok) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return response;
}

export async function currentSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}
