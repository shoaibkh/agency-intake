# Agency Intake
- public project intake
- webhook ingestion with HMAC verification
- async AI brief analysis
- internal dashboard with roles
- kanban stage management
- notes, assignment history, and analytics
- Redis rate limiting + caching
- PostgreSQL + Prisma schema

## Tech stack
- Next.js 14
- PostgreSQL + Prisma
- Upstash Redis
- bcrypt + JWT cookie auth
- Zod validation
- Recharts
- DnD Kit

## Setup

1. Copy `.env.example` to `.env`
2. Set `DATABASE_URL`, `JWT_SECRET`, `WEBHOOK_SECRET`
3. Set Upstash variables if you want rate limiting and analytics caching
4. Run:
   ```bash
   npm install
   npx prisma db push
   npx prisma db seed
   npm run dev
   ```

## Seeded users
- Admin: `INITIAL_ADMIN_EMAIL`
- Reviewer: `reviewer@agency.local`

## Notes
- The AI service supports any OpenAI-compatible provider through `AI_API_BASE_URL`, `AI_API_KEY`, and `AI_MODEL`.
- If no AI key is set, a deterministic fallback analysis is used.
- The dashboard uses optimistic stage updates.
- Use `/api/internal/process-ai-jobs` with `CRON_SECRET` from a scheduled cron job if you want reliable background AI processing.
- Realtime is implemented with a minimal SSE endpoint plus polling-friendly API routes.

## Important implementation notes
- Prisma schema includes indexes for stage, assignee, timestamps, analysis category, and notes/events.
- Cursor pagination is used for brief listing.
- Analytics are cached in Redis and invalidated on state changes.
- The public intake and webhook share the same internal pipeline.
