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
| Payments adapter | `src/lib/providers/payments.ts` + `src/lib/fees.ts` | Interface + full test implementation, 15% platform fee |
| Docker | `Dockerfile` | Multi-stage standalone build with Prisma migrate on start |

## Running locally

Requires Node 20+ and a PostgreSQL database.

```bash
cp .env.example .env.local
# Edit DATABASE_URL and any other values
npm install
npm run db:migrate   # or db:deploy
npm run db:seed      # optional demo data
npm run dev
```

See `.env.example` for configuration. Integrations without credentials stay in test mode.

## Notes

- Feature work is organized by ownership (facilitator, parent, payments-admin, messaging, etc.) to reduce merge conflicts.
- Schema changes are add-only by convention.
- All irreversible or sensitive actions re-check auth and ownership.
- This showcase omits some production infra scripts and the full feature implementations; the core patterns are preserved.

MIT License. Built as part of the GenLimitless work.
