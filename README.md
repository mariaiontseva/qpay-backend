# qpay-backend

QPay API + Companies House XML Gateway integration.

Companion repos:
- [`qpay-strategy`](https://github.com/mariaiontseva/qpay-strategy) — strategy, wireframes, CH access plan, architecture (public)
- [`qpay-app`](https://github.com/mariaiontseva/qpay-app) — Flutter mobile client

Full architecture: https://mariaiontseva.github.io/qpay-strategy/architecture.html

---

## What lives here

- **CH XML Gateway client** (`src/ch/`) — builds IN01 envelopes, signs them with CHMD5, submits to the sandbox / production gateway, parses responses.
- **Formation API** (`src/routes/formation.ts`) — `POST /v1/formation/submit` takes validated solo-founder input from the mobile app and returns CH's outcome.
- **Submission sequence** (`src/ch/submission-sequence.ts`) — unique, incremental `TransactionID` generator. Currently a flat JSON file; will move to Postgres when we wire Supabase.

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js 20 LTS (ES modules) |
| Language | TypeScript 5 |
| HTTP framework | Fastify 5 |
| Validation | Zod |
| XML | `xmlbuilder2` |
| Tests | Vitest |
| Env loading | `dotenv` + Zod schema in `src/config.ts` |

## Quick start

```bash
# 1. Install
npm install

# 2. Copy env template and fill in the Companies House sandbox credentials
cp .env.example .env
$EDITOR .env

# 3. Typecheck + tests
npm run typecheck
npm test

# 4. Boot the dev server
npm run dev
# → listening on :3001, GET /health returns { ok: true }
```

## Submit a test IN01 to the Companies House sandbox

Once `.env` is filled in with the test Presenter ID / Auth value / Package reference that Companies House issued:

```bash
npm run ch:test-submit
```

This will:

1. Build a sample IN01 body for an internal test company.
2. Allocate the next `TransactionID` from `data/submission-state.json`.
3. Wrap in a GovTalk envelope + CHMD5 auth.
4. POST to the XML Gateway (sandbox when `CH_TEST_FLAG=1`).
5. Write the outgoing XML and the full response to `./logs/` for Karolina at CH Software Support to review.

---

## ⚠️ Non-negotiable rules — read before touching anything

### 1. `TransactionID`s MUST be unique and strictly incremental

> *"Submission numbers have to be unique and incremental. This is very important, non-unique / incremental submission numbers will result in immediate rejections."* — Karolina, CH Software Developer Support

- The counter lives at `data/submission-state.json` (format: `{"next": N}`).
- `src/ch/submission-sequence.ts::nextTransactionId()` reads → increments → writes atomically on every submission.
- **Never reset `data/submission-state.json`.** Not locally, not after rebasing, not to "start fresh" in a new checkout. If anyone resets it, every future submission will be rejected by CH until we catch up past the last used id.
- When we migrate the counter to Postgres later, the initial row seed **must** be the last value used by the flat file, not `1`.
- This file is already in `.gitignore` — do not `git add -f` it.

### 2. Every test submission is reviewed by Karolina

> *"Your next step now is to tell me when you have submitted tests so I can review them."*

After each `npm run ch:test-submit`, notify Maria with the outcome and the paths to `logs/submit-*.xml` and `logs/response-*.xml` so she can forward them to Karolina. CH sandbox submissions are not fire-and-forget.

### 3. Credentials stay in `.env`

Test credentials (Presenter ID, Auth Value, Package Reference) go in `.env` — never in a commit, never in logs, never in issue comments.

---

## Layout

```
src/
  main.ts                    # Entry — loads config, starts Fastify
  server.ts                  # Fastify app factory
  config.ts                  # Zod-validated env loader
  routes/
    health.ts                # GET /health
    formation.ts             # POST /v1/formation/submit
  ch/
    auth-hash.ts             # CHMD5 hash of presenter+auth+body
    envelope.ts              # GovTalk envelope builder
    in01-builder.ts          # Solo-founder IN01 payload
    gateway-client.ts        # HTTP submission + response parsing
    submission-sequence.ts   # Unique incremental TransactionID
    __tests__/               # Vitest specs
  cli/
    test-submit.ts           # One-shot sandbox submission CLI
```

## Env vars

See `.env.example`. The backend fails fast at boot if any required value is missing or malformed.

Secrets (`CH_AUTH_VALUE`, `SUPABASE_SERVICE_ROLE_KEY`) stay here — never shipped to the mobile app.

## Current scope

The CH integration is intentionally minimal:

- **Included:** solo founder (1 director = 1 shareholder = 1 PSC), 100 Ordinary shares @ £1, Model Articles, England & Wales, registered office at QPay London, registered email private.
- **Not included yet:** multi-founder cap tables, bespoke articles, corporate directors / secretaries, §243 privacy, RLE PSCs, guarantee companies.

These map directly to the simplifications applied in the Path A formation flow — see `qpay-strategy/formation.html` for the product context.

## Access

Public read. Push access granted to collaborators via invitation.

## Related

- [Architecture](https://mariaiontseva.github.io/qpay-strategy/architecture.html)
- [Formation flow (Path A wireframes)](https://mariaiontseva.github.io/qpay-strategy/formation.html)
- [Companies House access plan](https://mariaiontseva.github.io/qpay-strategy/ch-access.html)
