# Kasbon

Track who owes whom, mark it paid, done. A small web app for keeping tabs on personal debts.

**Demo:** https://kasbon-system.vercel.app (sign up right away, no email confirmation needed)

> The app's UI copy and API error messages are in casual Indonesian, as required by the brief.

## Stack

- Next.js 16 (App Router, `proxy.ts`) + strict TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL + Auth + RLS)
- Lucide React

### Extra libraries and why

| Library                                   | Why                                                                                                                                                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@supabase/ssr`                           | Keeps the Supabase session in cookies, so it can be read in Server Components, Route Handlers and `proxy.ts`.                                                                                                   |
| `zod`                                     | One schema (`src/features/debts/schemas.ts`) validates the form on the client **and** the body/query in the API, so the rules and error messages can never drift apart.                                         |
| `react-hook-form` + `@hookform/resolvers` | Uncontrolled forms (no re-render on every keystroke), per-field errors straight from the zod schema via `zodResolver`, plus `isSubmitting` for loading states.                                                  |
| `server-only`                             | Fails the build if server code (Supabase server client, API helpers) is ever imported from the client.                                                                                                          |
| `tailwind-merge`                          | `cn()` merges a component's classes with the caller's; when they clash (e.g. `text-sm` vs `text-base`) the last one wins. Without it the result depends on CSS order, which once made button borders disappear. |
| `husky` + `@commitlint/*`                 | Commits that don't follow [Conventional Commits](https://www.conventionalcommits.org) are rejected by the `commit-msg` hook. `pre-commit` runs lint, a format check and the tests.                              |
| `prettier`                                | Consistent formatting.                                                                                                                                                                                          |

Deliberately **not** used: a data-fetching library (one `useDebts` hook is enough), a chart library (the bar chart is `div`s + CSS), a date library (`Intl` + a few small functions in `src/shared/lib/format.ts`).

## Local setup

Requires Node 22.18+ (the tests use Node's built-in type stripping) and pnpm.

1. **Install**

   ```bash
   pnpm install
   ```

2. **Env** — copy `.env.example` to `.env.local` and fill it in from Supabase → Project Settings → API:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # or the anon key
   ```

   Both values are public by design; RLS is what protects the data. The app does **not** need the `service_role` key at all.

3. **Migrate** — either:
   - Supabase Dashboard → SQL Editor → run **every** file in `supabase/migrations/` **in order** (by file name), pasting each one → Run.
   - Or with the CLI: `pnpm dlx supabase link --project-ref <ref>` then `pnpm dlx supabase db push`.

4. **Auth** — Supabase → Authentication → Sign In / Providers → Email. If "Confirm email" is on, users must click the link in their email before they can sign in (the app already shows a message for that).

5. **Run**

   ```bash
   pnpm dev        # http://localhost:3000
   ```

### Scripts

| Script           | What it does                                                        |
| ---------------- | ------------------------------------------------------------------- |
| `pnpm dev`       | Dev server                                                          |
| `pnpm build`     | Production build                                                    |
| `pnpm lint`      | ESLint                                                              |
| `pnpm typecheck` | Generate route types + `tsc --noEmit`                               |
| `pnpm test`      | Unit tests (`node --test`): formatting, summary, optimistic patches |
| `pnpm format`    | Prettier                                                            |

## API

Every endpoint requires a signed-in user (Supabase session cookie). Errors are always `{ "error": "<message in Indonesian>" }`.

| Method   | Path              | Description                                                                                                                           |
| -------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/debts`      | `?status=all\|open\|settled` `&type=all\|owed_to_me\|i_owe` `&q=<name>` `&sort=date\|amount` → `200 { data: Debt[] }`                 |
| `POST`   | `/api/debts`      | `{ type, counterpart_name, amount, due_date, note? }` → `201 { data: Debt }`                                                          |
| `PATCH`  | `/api/debts/[id]` | Any of the POST fields, plus `settled: boolean` → `200 { data: Debt }`. `settled: true` is idempotent (the settled time never moves). |
| `DELETE` | `/api/debts/[id]` | `204`                                                                                                                                 |

Status codes: `400` invalid input (including unknown fields such as `user_id`), `401` not signed in, `404` not found / not yours, `500` server error (details only in the server log).

## RLS leak check

Ready to run with just `bash` + `curl` (Git Bash on Windows works too). The publishable key below is public by design: the data is protected by RLS in Postgres, not by keeping the key secret. The script creates two fresh accounts (A and B), A records one entry, then B tries to read, edit, delete and impersonate A directly through the Supabase REST API (bypassing the app).

```bash
URL="https://lphyvvojxisvxpnfkmkx.supabase.co"
KEY="sb_publishable_tIPI5scvwUnD2SvEilt0rA_wbxGUqqk"
H=(-H "apikey: $KEY" -H "Content-Type: application/json")
token() { curl -s "$URL/auth/v1/signup" "${H[@]}" -d "{\"email\":\"$1\",\"password\":\"Secret-12345\"}" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4; }
A=$(token "rls-a-$RANDOM@example.com")
B=$(token "rls-b-$RANDOM@example.com")
A_ID=$(curl -s "$URL/auth/v1/user" "${H[@]}" -H "Authorization: Bearer $A" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# A records a private entry
ID=$(curl -s "$URL/rest/v1/debts" "${H[@]}" -H "Authorization: Bearer $A" -H "Prefer: return=representation" \
  -d '{"type":"owed_to_me","counterpart_name":"Secret A","amount":777}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# B reads everything → []
curl -s "$URL/rest/v1/debts?select=*" "${H[@]}" -H "Authorization: Bearer $B"; echo
# B reads A's entry → []
curl -s "$URL/rest/v1/debts?id=eq.$ID" "${H[@]}" -H "Authorization: Bearer $B"; echo
# B edits A's entry → [] (0 rows changed)
curl -s -X PATCH "$URL/rest/v1/debts?id=eq.$ID" "${H[@]}" -H "Authorization: Bearer $B" -H "Prefer: return=representation" -d '{"amount":1}'; echo
# B deletes A's entry → [] (0 rows deleted)
curl -s -X DELETE "$URL/rest/v1/debts?id=eq.$ID" "${H[@]}" -H "Authorization: Bearer $B" -H "Prefer: return=representation"; echo
# B creates an entry owned by A → 403
curl -s -o /dev/null -w "%{http_code}\n" "$URL/rest/v1/debts" "${H[@]}" -H "Authorization: Bearer $B" \
  -d "{\"type\":\"i_owe\",\"counterpart_name\":\"spoof\",\"amount\":1,\"user_id\":\"$A_ID\"}"
# API key only, not signed in → 401 "permission denied for table debts"
curl -s "$URL/rest/v1/debts?select=*" "${H[@]}"; echo
# A checks again → still [{"counterpart_name":"Secret A","amount":777}], untouched
curl -s "$URL/rest/v1/debts?select=counterpart_name,amount" "${H[@]}" -H "Authorization: Bearer $A"; echo
```

Through the app's API (`/api/debts`) the result is the same: `401` when not signed in, and `404` for another user's entry.

## Structure

Feature-based: everything that belongs to one feature lives together; `app/` is a thin routing layer.

```
src/
  app/                    # routing: (auth)/login, (app)/ dashboard, api/debts
  proxy.ts                # session refresh + page gate (Next 16's replacement for middleware)
  features/
    auth/                 # schema, server actions, AuthForm
    debts/                # zod schema, API client, hooks, components, summary + optimistic logic (+ tests)
  shared/
    components/ui/        # Button, Input, Select, Dialog, SegmentedControl, Toast
    hooks/                # useToast, useDebouncedValue
    lib/                  # Supabase clients, Rupiah/date formatting (+ tests), HTTP helpers, env
supabase/migrations/      # schema + RLS
```

## Approach

There are two things I'm most proud of. First, the **feature-based architecture**: everything that belongs to a feature (schema, API client, hooks, components, logic and its tests) lives together in `src/features/<feature>`, `app/` is just thin routing that calls into features, and `shared/` only holds generic pieces (UI primitives, the Supabase client, Rupiah/date formatting). The boundaries are kept: `auth` and `debts` never import each other and `shared/` never depends on a feature, so adding or removing a feature touches a single folder. Second, the **commit message standard**: every commit must follow [Conventional Commits](https://www.conventionalcommits.org), enforced by tooling rather than discipline: the `commit-msg` hook (husky + commitlint) rejects non-conforming messages and `pre-commit` runs lint, a format check and the unit tests. The result is a history that reads like a changelog (`feat(db)`, `feat(auth)`, `fix(ui)`, `docs`), with small commits that each do one thing. At the code level the principle is a **single source of truth**: the same strict zod schema is used by the form and the API, so client and server validation can't diverge and smuggled fields such as `user_id` are rejected outright; RLS in Postgres is the last line of defence because the API deliberately uses the user's own session (not the service role); and "Tandai lunas" (mark as paid) is idempotent on the server, so a refresh never flips the status back.

## Notes for reviewers

- **"Confirm email" is deliberately turned off** in the demo Supabase project. Supabase's built-in email service only delivers to members of the project's team (and is rate-limited), so with it on you would never receive the confirmation link and couldn't sign in. With it off you can sign up two accounts straight away to test RLS. Data security is unaffected: the data is protected by RLS, not by email verification.
- For production: turn "Confirm email" back on and configure your own SMTP (Resend / SES). The app is already prepared: with confirmation on, the sign-up page shows "Sip! Cek email kamu buat konfirmasi…" ("Check your email to confirm…").

## Trade-offs (with one more day)

- **Optimistic updates for create/edit.** Mark-as-paid and delete are already optimistic (the change shows instantly and rolls back automatically if the server fails), but the create/edit form still waits for the server because server validation errors are shown inside the form.
- **Filters in the URL** (`?status=open&q=budi`) so they can be shared/bookmarked and survive a refresh.
- **Pagination / infinite scroll** — the list is currently fetched in one go; fine for personal use, not for thousands of entries.
- **Automated integration tests** for the API + RLS (local Supabase in CI), instead of only unit tests plus manual curl checks.
- **Email verification** is off for the demo (see the notes above); production needs its own SMTP.
- **Sorting** is descending only (newest / largest); there is no ascending toggle yet.

## Time spent

About 5 hours.
