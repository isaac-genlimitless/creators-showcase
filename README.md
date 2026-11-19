# Creators — K-12 Microschool Marketplace (Showcase)

A production-oriented marketplace for parents to find and enroll children in facilitator-run microschools (ages ~5–18). Facilitators launch schools, parents discover and enroll, and the platform takes a 15% fee.

This is a **sanitized public showcase**. Server-specific paths, production hostnames, seed credentials, and other operational details have been removed or abstracted. It demonstrates architecture, conventions, auth, data modeling, and provider adapters — not a ready-to-deploy product with real secrets.

## Product overview

- **Facilitators** apply, complete background checks, set up schools (in-person, virtual, or hybrid), manage compliance, and receive payouts.
- **Parents** browse schools by location/age, request enrollments, pay tuition (or use Utah Fits All invoicing), message facilitators, and schedule meetings or 1:1 sessions.
- **Kids** have limited, parent-controlled accounts (PIN login, short sessions) for messaging and an AI companion.
- **Admins** review applications, compliance, disputes, and can "view as" users for support.
- Strong focus on **COPPA**: kids have no email, phone, photo, or location fields. Location data for schools is split into public approx area vs private exact address.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Prisma 6** + **PostgreSQL**
- **Tailwind CSS v4**
- **Zod** for validation
- Custom DB sessions (no Auth.js) with separate adult and kid cookies
- Provider adapters for payments (Stripe-shaped, test mode by default), background checks, email, storage, and geo
- Docker multi-stage build for production

## What's interesting here

| Area | Where | What it shows |
| --- | --- | --- |
| Conventions & multi-branch workflow | `CONVENTIONS.md` | Clear ownership rules, schema discipline, auth helpers, provider pattern |
| Data model | `prisma/schema.prisma` | Money in integer cents, age-based (not grades), COPPA constraints, enrollment/payment uniqueness |
| Auth | `src/lib/auth.ts` | Custom sessions, role checks, admin view-as, kid sessions |
| Payments adapter | `src/lib/providers/payments.ts` + `src/lib/fees.ts` | Interface + full test implementation that fails closed in production, 15% platform fee (tested in `test/`) |
| Docker | `Dockerfile`, `docker/entrypoint.sh` | Multi-stage standalone build; migrations run with a pinned Prisma CLI on start |

## What's in this excerpt (and what isn't)

This repo is a **code excerpt**, not a runnable app. It holds the files listed above. The pages (`src/app`), the
remaining `src/lib` helpers (`db`, `format`, billing), the seed script, the migrations and most of the auth module
(view-as, kid sessions) are not included, so `npm run dev` and `docker build` will not work here. The `Dockerfile`
is the production one, shown for reference.

What you can run:

```bash
npm ci
npm test              # fee math and the payments adapter (node:test, Node 22.18+)
npx prisma validate   # the schema excerpt is a valid Prisma schema (needs any DATABASE_URL value)
```

CI runs the same checks on every push and pull request.

### Safety defaults worth noting

- **Payments fail closed.** In production, a missing `STRIPE_SECRET_KEY` stops the app instead of quietly
  switching to the test adapter (which approves every charge). `ALLOW_TEST_PAYMENTS=1` is the explicit opt-in for a demo deploy.
- **Payment history is never cascade-deleted.** `Payment` uses `onDelete: Restrict`, so removing an account or
  enrollment cannot erase financial records.
- **One enrollment per kid per school**, enforced by a unique index.
- **Migrations use the Prisma CLI pinned in the image**, never a runtime `npx` download.

## Notes

- Feature work is organized by ownership (facilitator, parent, payments-admin, messaging, etc.) to reduce merge conflicts.
- Schema changes are add-only by convention.
- All irreversible or sensitive actions re-check auth and ownership.
- This showcase omits some production infra scripts and the full feature implementations; the core patterns are preserved.

MIT License. Built as part of the GenLimitless work.
