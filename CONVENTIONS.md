# Creators — conventions (sanitized showcase)

Creators is a microschool marketplace for ages 5–18. Facilitators launch schools, parents find and enroll kids, the platform keeps **15%** of tuition.

This file captures the engineering conventions used during development. Server-specific paths, ports for other services, and credential locations have been removed.

Stack: Next.js 16 (App Router) · React 19 · TypeScript strict · Prisma 6 + PostgreSQL · Tailwind CSS v4 · zod 4 · bcryptjs. Custom DB sessions (no Auth.js).

---

## Route & file ownership (avoid merge conflicts)

Work is split so feature branches own distinct areas:

| Owner | Pages | API routes | Code |
|---|---|---|---|
| facilitator | `/facilitator/**` | `/api/facilitator/**` | `src/features/facilitator/**` |
| parent | `/schools`, `/schools/[slug]`, `/parent/**` | `/api/parent/**`, `/api/schools/**` | `src/features/parent/**` |
| payments-admin | `/admin/**` | `/api/admin/**`, `/api/billing/**` | `src/features/payments-admin/**`, `src/lib/billing/**` |
| messaging | `/messages/**`, `/kid/**` | `/api/messages/**`, `/api/kid/**` | `src/features/messaging*/**` |
| foundation (shared) | `/`, `/login`, `/signup`, `/account`, layout | `/api/auth/**`, `/api/health`, `/api/uploads/**` | `src/lib/*.ts`, `src/components/**`, `prisma/schema.prisma` |

Cross-branch helpers stay inside the owning feature folder. Shared changes are kept minimal and called out.

## Database & schema rules

- **Money is integer cents** everywhere (`tuitionCents`, `amountCents`, `platformFeeCents` …).
- **Ages, never grades**: students and schools are described by AGE. Legacy grade columns remain unused.
- `User.roles: Role[]` — one account can be `PARENT` + `FACILITATOR`; `ADMIN` is only set by seed/DB.
- `Location.exactAddress` is private — only shown to ACCEPTED/ACTIVE families and admins. Public fields are `approxArea` + `city`.
- `Payment` is unique per `(enrollmentId, periodStart)` for idempotent billing, and is never cascade-deleted (`onDelete: Restrict`).
- `Enrollment` is unique per `(kidId, schoolId)`.
- **COPPA**: `Kid` has no email, phone, photo or location — never add them.
- Messaging: a thread that includes a kid must also include that kid’s facilitator.

Schema changes are add-only (new models/fields at the bottom of the relevant section). No renames, type changes, or deletions of existing columns without a deliberate migration plan.

## Auth helpers — `@/lib/auth` (server-only)

```ts
getCurrentUser(): Promise<CurrentUser | null>
requireUser(nextPath?: string): Promise<CurrentUser>
requireRole(role: Role | Role[], nextPath?): Promise<CurrentUser>
hasRole(user, role): boolean
getCurrentKid(): Promise<CurrentKid | null>
requireKid(): Promise<CurrentKid>
homePathFor(user): string
startUserSession(userId) / endUserSession() / revokeAllUserSessions(userId)
startKidSession(kidId) / endKidSession()
hashPassword / verifyPassword / hashPin / verifyPin
```

- Cookies: `creators_session` (adults, 30 days) and `creators_kid` (kids, 12 h); httpOnly, SameSite=Lax, Secure in production.
- Tokens are random 32 bytes; only their sha256 is stored.
- Always re-check ownership inside actions (e.g. a facilitator may only edit their own schools).
- Admin "view as" is a short-lived, signed cookie bound to the real admin session.

## Writing features

- Server Components fetch with `prisma` directly.
- Mutations use Server Actions or route handlers. Validate every input with **zod**. Re-check auth + ownership inside every action.
- Use helpers for audit logging, formatting (cents, ages), and HTTP responses.
- Next 16: `params`, `searchParams`, `cookies()`, `headers()` are async.

## Provider adapters — `@/lib/providers/*` (TEST mode by default)

Feature code calls the adapter; it never imports a provider SDK directly. When real keys are absent, a full test implementation is used.

- **payments**: Stripe Connect-shaped. Test mode succeeds unless forced to fail or a decline test card is used. In production a missing key is an error, never a silent fall-back to test mode.
- **backgroundCheck**, **email**, **geo**, **storage**: similarly stubbed for development.

Fees live in `@/lib/fees`: `PLATFORM_FEE_BPS = 1500` (15%), `platformFee(amountCents)`, `facilitatorNet`, `applyDiscount`.

## UI & brand

Name **Creators**. Shared utility classes (`btn-primary`, `card`, `input`, etc.) and a consistent teal/coral palette. Mobile-first. Kid pages use bigger type and friendly copy.

## Hand-off checklist

- Only files you own changed (or minimal shared hunks called out)
- Schema: no change, or add-only + own migration
- `typecheck`, `lint`, and `build` pass
- Every action/route re-checks auth + ownership; inputs validated with zod
- No secrets in code or commits

This conventions file is the main contract that kept multi-branch work coherent.
