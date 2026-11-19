import "server-only";
import crypto from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "./db";

export const USER_COOKIE = "creators_session";
export const KID_COOKIE = "creators_kid";
/** Admin "view as" cookie: signed, bound to the admin's own session, short-lived, view-only. */
export const VIEW_AS_COOKIE = "creators_view_as";
const VIEW_AS_MINUTES = 60;
const USER_SESSION_DAYS = 30;
const KID_SESSION_HOURS = 12;

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  roles: Role[];
};

export type CurrentKid = {
  id: string;
  firstName: string;
  username: string;
  age: number;
  parentId: string;
};

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}
/** Kid PINs are 4-6 digits; hashed exactly like passwords. */
export const PIN_REGEX = /^\d{4,6}$/;
export const hashPin = hashPassword;
export const verifyPin = verifyPassword;

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
function newToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}
function secureCookies(): boolean {
  if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE === "true";
  return process.env.NODE_ENV === "production";
}
async function requestMeta() {
  const h = await headers();
  return {
    userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
    // x-real-ip is set by our reverse proxy. The left-most X-Forwarded-For entry is client-controlled, so it is not used.
    ip: h.get("x-real-ip") ?? null,
  };
}

export async function startUserSession(userId: string): Promise<void> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + USER_SESSION_DAYS * 86_400_000);
  await prisma.userSession.create({ data: { tokenHash: hashToken(token), userId, expiresAt, ...(await requestMeta()) } });
  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  (await cookies()).set(USER_COOKIE, token, {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endUserSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(USER_COOKIE)?.value;
  if (token) await prisma.userSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(USER_COOKIE);
  jar.delete(VIEW_AS_COOKIE);
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.userSession.deleteMany({ where: { userId } });
}

const getRealSession = cache(async (): Promise<{ user: CurrentUser; tokenHash: string } | null> => {
  const token = (await cookies()).get(USER_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const s = await prisma.userSession.findUnique({
    where: { tokenHash },
    select: { expiresAt: true, user: { select: { id: true, email: true, name: true, roles: true, suspended: true } } },
  });
  if (!s || s.expiresAt < new Date() || s.user.suspended) return null;
  const { suspended: _s, ...user } = s.user;
  void _s;
  return { user, tokenHash };
});

export async function getRealUser(): Promise<CurrentUser | null> {
  return (await getRealSession())?.user ?? null;
}

// Admin view-as and remaining helpers omitted in this shortened showcase excerpt for brevity.
// Full implementation includes signed view-as claims, getCurrentUser (respects view-as),
// requireUser / requireRole, kid sessions, and ownership re-checks.

export function hasRole(user: CurrentUser | null | undefined, role: Role): boolean {
  return !!user && user.roles.includes(role);
}

export async function requireUser(nextPath?: string): Promise<CurrentUser> {
  const user = await getRealUser();
  if (!user) redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  return user;
}

export async function requireRole(role: Role | Role[], nextPath?: string): Promise<CurrentUser> {
  const user = await requireUser(nextPath);
  const wanted = Array.isArray(role) ? role : [role];
  if (wanted.some((r) => user.roles.includes(r))) return user;
  if (wanted.includes("ADMIN") && wanted.length === 1) redirect("/?error=forbidden");
  redirect(`/account?need=${wanted[0]}`);
}

export function homePathFor(user: Pick<CurrentUser, "roles">): string {
  if (user.roles.includes("ADMIN")) return "/admin";
  if (user.roles.includes("FACILITATOR")) return "/facilitator";
  if (user.roles.includes("PARENT")) return "/parent";
  return "/account";
}

export async function requireKid(): Promise<CurrentKid> {
  // Full implementation checks kid cookie / view-as and parent suspension status.
  redirect("/kid/login");
}
