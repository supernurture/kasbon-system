# Kasbon

Catat siapa utang siapa, tandai lunas, beres. Web app sederhana buat ngelacak utang piutang pribadi.

**Demo:** https://kasbon-system.vercel.app (langsung daftar akun baru, gak perlu konfirmasi email)

## Stack

- Next.js 16 (App Router, `proxy.ts`) + TypeScript strict
- Tailwind CSS v4
- Supabase (PostgreSQL + Auth + RLS)
- Lucide React

### Library tambahan & alasannya

| Library                                   | Kenapa                                                                                                                                                                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@supabase/ssr`                           | Session Supabase disimpan di cookie, jadi bisa dibaca di Server Component, Route Handler, dan `proxy.ts`.                                                                                                                   |
| `zod`                                     | Satu schema (`src/features/debts/schemas.ts`) dipakai buat validasi form di client **dan** body/query di API. Aturan dan pesan error gak mungkin beda.                                                                      |
| `react-hook-form` + `@hookform/resolvers` | Form uncontrolled (gak re-render tiap ketikan), error per field langsung dari schema zod via `zodResolver`, plus `isSubmitting` buat loading state.                                                                         |
| `server-only`                             | Bikin build gagal kalau kode server (Supabase server client, helper API) ke-import dari client.                                                                                                                             |
| `tailwind-merge`                          | `cn()` menggabungkan class komponen dengan class dari pemanggil; kalau bentrok (mis. `text-sm` vs `text-base`), class terakhir yang menang. Tanpa ini hasilnya tergantung urutan CSS dan sempat bikin border tombol hilang. |
| `husky` + `@commitlint/*`                 | Commit yang gak ngikutin [Conventional Commits](https://www.conventionalcommits.org) ditolak di hook `commit-msg`. `pre-commit` jalanin lint, cek format, dan test.                                                         |
| `prettier`                                | Format konsisten.                                                                                                                                                                                                           |

Yang sengaja **gak** dipakai: data-fetching library (cukup satu hook `useDebts`), chart library (bar chart cukup `div` + CSS), date library (`Intl` + fungsi kecil di `src/shared/lib/format.ts`).

## Setup lokal

Butuh Node 22.18+ (test pakai type stripping bawaan Node) dan pnpm.

1. **Install**

   ```bash
   pnpm install
   ```

2. **Env** — salin `.env.example` jadi `.env.local`, isi dari Supabase → Project Settings → API:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # atau anon key
   ```

   Dua-duanya memang publik; yang ngelindungin data adalah RLS. App ini **gak** butuh `service_role` key sama sekali.

3. **Migrate** — pilih salah satu:
   - Supabase Dashboard → SQL Editor → jalankan **semua** file di `supabase/migrations/` **berurutan** (urut nama file), masing-masing paste → Run.
   - Atau pakai CLI: `pnpm dlx supabase link --project-ref <ref>` lalu `pnpm dlx supabase db push`.

4. **Auth** — Supabase → Authentication → Sign In / Providers → Email. Kalau "Confirm email" nyala, user harus klik link di email dulu sebelum bisa masuk (app udah nampilin pesannya).

5. **Jalanin**

   ```bash
   pnpm dev        # http://localhost:3000
   ```

### Script

| Script           | Fungsi                                     |
| ---------------- | ------------------------------------------ |
| `pnpm dev`       | Dev server                                 |
| `pnpm build`     | Production build                           |
| `pnpm lint`      | ESLint                                     |
| `pnpm typecheck` | Generate route types + `tsc --noEmit`      |
| `pnpm test`      | Unit test (`node --test`) format & summary |
| `pnpm format`    | Prettier                                   |

## API

Semua endpoint wajib login (cookie session Supabase). Error selalu `{ "error": "<pesan Bahasa Indonesia>" }`.

| Method   | Path              | Keterangan                                                                                                                    |
| -------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/debts`      | `?status=all\|open\|settled` `&type=all\|owed_to_me\|i_owe` `&q=<nama>` `&sort=date\|amount` → `200 { data: Debt[] }`         |
| `POST`   | `/api/debts`      | `{ type, counterpart_name, amount, due_date, note? }` → `201 { data: Debt }`                                                  |
| `PATCH`  | `/api/debts/[id]` | Field mana aja dari POST, plus `settled: boolean` → `200 { data: Debt }`. `settled: true` idempotent (waktu lunas gak geser). |
| `DELETE` | `/api/debts/[id]` | `204`                                                                                                                         |

Status code: `400` input gak valid (termasuk field asing kayak `user_id`), `401` belum login, `404` gak ada / bukan punya kamu, `500` error server (detail cuma di log server).

## Cek kebocoran RLS

Bisa langsung dicoba, cukup `bash` + `curl` (Git Bash di Windows juga jalan). Publishable key di bawah memang publik by design: yang ngejaga data itu RLS di Postgres, bukan kerahasiaan key. Script-nya bikin dua akun baru (A dan B), A nyatet satu entry, lalu B nyoba baca, edit, hapus, dan nyamar jadi A lewat Supabase REST API langsung (tanpa lewat app).

```bash
URL="https://lphyvvojxisvxpnfkmkx.supabase.co"
KEY="sb_publishable_tIPI5scvwUnD2SvEilt0rA_wbxGUqqk"
H=(-H "apikey: $KEY" -H "Content-Type: application/json")
token() { curl -s "$URL/auth/v1/signup" "${H[@]}" -d "{\"email\":\"$1\",\"password\":\"Rahasia-12345\"}" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4; }
A=$(token "rls-a-$RANDOM@example.com")
B=$(token "rls-b-$RANDOM@example.com")
A_ID=$(curl -s "$URL/auth/v1/user" "${H[@]}" -H "Authorization: Bearer $A" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# A nyatet entry pribadi
ID=$(curl -s "$URL/rest/v1/debts" "${H[@]}" -H "Authorization: Bearer $A" -H "Prefer: return=representation" \
  -d '{"type":"owed_to_me","counterpart_name":"Rahasia A","amount":777}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# B baca semua → []
curl -s "$URL/rest/v1/debts?select=*" "${H[@]}" -H "Authorization: Bearer $B"; echo
# B baca entry A → []
curl -s "$URL/rest/v1/debts?id=eq.$ID" "${H[@]}" -H "Authorization: Bearer $B"; echo
# B edit entry A → [] (0 baris berubah)
curl -s -X PATCH "$URL/rest/v1/debts?id=eq.$ID" "${H[@]}" -H "Authorization: Bearer $B" -H "Prefer: return=representation" -d '{"amount":1}'; echo
# B hapus entry A → [] (0 baris kehapus)
curl -s -X DELETE "$URL/rest/v1/debts?id=eq.$ID" "${H[@]}" -H "Authorization: Bearer $B" -H "Prefer: return=representation"; echo
# B bikin entry atas nama A → 403
curl -s -o /dev/null -w "%{http_code}\n" "$URL/rest/v1/debts" "${H[@]}" -H "Authorization: Bearer $B" \
  -d "{\"type\":\"i_owe\",\"counterpart_name\":\"nyamar\",\"amount\":1,\"user_id\":\"$A_ID\"}"
# Cuma API key, tanpa login → 401 "permission denied for table debts"
curl -s "$URL/rest/v1/debts?select=*" "${H[@]}"; echo
# A cek lagi → masih [{"counterpart_name":"Rahasia A","amount":777}], gak berubah
curl -s "$URL/rest/v1/debts?select=counterpart_name,amount" "${H[@]}" -H "Authorization: Bearer $A"; echo
```

Lewat API app (`/api/debts`) hasilnya sama: tanpa login `401`, dan entry milik user lain `404`.

## Struktur

Feature-based: semua yang nyangkut satu fitur tinggal bareng; `app/` cuma routing tipis.

```
src/
  app/                    # routing: (auth)/login, (app)/ dashboard, api/debts
  proxy.ts                # refresh session + gate halaman (Next 16 pengganti middleware)
  features/
    auth/                 # schema, server actions, AuthForm
    debts/                # schema zod, API client, hooks, komponen, logic summary (+ test)
  shared/
    components/ui/        # Button, Input, Select, Dialog, SegmentedControl, Toast
    hooks/                # useToast, useDebouncedValue
    lib/                  # supabase clients, format Rupiah/tanggal (+ test), helper HTTP, env
supabase/migrations/      # skema + RLS
```

## Approach

Yang paling aku banggain ada dua. Pertama, **feature-based architecture**: semua yang nyangkut satu fitur (schema, API client, hooks, komponen, logic + test-nya) tinggal bareng di `src/features/<fitur>`, `app/` cuma routing tipis yang manggil fitur, dan `shared/` cuma isi hal generik (UI primitives, Supabase client, format Rupiah/tanggal). Aturannya dijaga: `auth` dan `debts` gak saling import, `shared/` gak boleh bergantung ke fitur mana pun, jadi nambah atau ngehapus fitur cukup di satu folder tanpa nyenggol yang lain. Kedua, **standar commit message**: setiap commit wajib ngikutin [Conventional Commits](https://www.conventionalcommits.org) dan itu dipaksa tooling, bukan cuma disiplin: hook `commit-msg` (husky + commitlint) nolak pesan yang gak sesuai, dan `pre-commit` jalanin lint, cek format, dan unit test. Hasilnya history yang kebaca kayak changelog (`feat(db)`, `feat(auth)`, `fix(ui)`, `docs`), tiap commit kecil dan fokus satu perubahan. Di level kode, prinsipnya **satu sumber kebenaran**: schema zod yang sama (`strict`) dipakai form dan API sehingga validasi client & server gak mungkin beda dan field selundupan kayak `user_id` langsung ditolak, sementara RLS di Postgres jadi pagar terakhir karena API sengaja pakai session user (bukan service role), dan "Tandai lunas" idempotent di server jadi refresh gak pernah bikin status balik.

## Catatan buat reviewer

- **"Confirm email" sengaja dimatikan** di project Supabase demo. Layanan email bawaan Supabase cuma ngirim ke anggota tim project (dan jumlahnya dibatasi), jadi kalau nyala, kamu gak bakal nerima link konfirmasi dan gak bisa masuk. Dengan dimatikan, kamu bisa langsung daftar dua akun buat ngetes RLS. Keamanan data gak berkurang: yang ngelindungin data itu RLS, bukan verifikasi email.
- Buat production: nyalain lagi "Confirm email" + pasang SMTP sendiri (Resend / SES). App-nya udah siap: kalau konfirmasi nyala, halaman daftar nampilin "Sip! Cek email kamu buat konfirmasi…".

## Trade-off (kalau ada 1 hari lagi)

- **Optimistic update buat catat baru/edit.** Tandai lunas & hapus udah optimistic (langsung berubah, rollback otomatis kalau server gagal), tapi form catat/edit masih nunggu server dulu karena error validasi server ditampilin di dalam form.
- **Filter di URL** (`?status=open&q=budi`) biar bisa di-share/bookmark dan selamat dari refresh.
- **Pagination / infinite scroll** — sekarang list diambil sekaligus; cukup buat pemakaian pribadi, gak buat ribuan entry.
- **Test integrasi** API + RLS otomatis (Supabase lokal di CI), bukan cuma unit test format & summary plus cek manual pakai curl.
- **Verifikasi email** dimatikan demi demo (lihat catatan di atas); production butuh SMTP sendiri.
- **Sort** baru arah turun (terbaru / terbesar); belum ada toggle naik.

## Time spent

±5 jam.
