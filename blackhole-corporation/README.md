# Blackhole Corporation — Starter Build

This is a working foundation, not the finished platform: authentication, the database
schema for the whole structure (Realms → Mains → Departments → Roles/Chats/Warnings),
and three placeholder pages (login, General Dashboard, per-Realm dashboard). It builds
cleanly with `npm run build`. Everything else in `blackhole-corporation-structure.md`
(Council permissions, warning ladder, transfer limits, add-member request queue, theme
locking, nickname editing) has tables/fields ready in the schema but no UI yet — see
"What's built vs. what's next" below.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Once it's ready, open **SQL Editor** → paste the entire contents of
   `supabase/schema.sql` → Run. This creates every table (profiles, realms, mains,
   departments, roles, chats, warnings, transfers, etc.) with starter RLS policies.
3. Go to **Project Settings → API Keys** and note:
   - Project URL
   - Publishable key (`sb_publishable_...`)
   - Secret key (`sb_secret_...`) — **server-only, never expose to the browser**
4. Seed the three realms (SQL Editor):
   ```sql
   insert into public.realms (name) values ('Estate'), ('Academy'), ('Syndicate');
   ```
5. Create your own Admin account: **Authentication → Users → Add User**, e.g.
   email `you@blackhole.local`, set a password, then link it to a profile:
   ```sql
   insert into public.profiles (id, username, display_name, higher_up_rank)
   select id, 'youradminusername', 'Your Name', 'owner'
   from auth.users where email = 'you@blackhole.local';
   ```

## 2. Run it locally

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY
npm install
npm run dev
```

Open `http://localhost:3000/login` and sign in with the username you set above
(not the full email — the app appends `@blackhole.local` automatically).

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Blackhole Corporation starter"
git branch -M main
git remote add origin https://github.com/<your-username>/blackhole-corporation.git
git push -u origin main
```

## 4. Deploy to Vercel

1. [vercel.com](https://vercel.com) → Add New → Project → import the GitHub repo.
2. Framework Preset should auto-detect as **Next.js**.
3. Under **Environment Variables**, add the same three keys from `.env.local`
   (paste the whole block using Vercel's "Import .env" option, or add one by one).
4. Deploy. Once it's Ready, visit `https://<your-project>.vercel.app/login`.

## What's built vs. what's next

**Built:** schema for the entire structure, username-based login, session
middleware, General Dashboard page (reads `general_posts`), per-Realm dashboard
page (reads `realms` + `mains`, applies the realm's locked background theme).

**Not built yet** (schema is ready, UI/logic isn't):
- Admin UI to create Mains/Departments and assign roles
- Department pages: Tambayan + Rankings chats, Council view, member roster
- Add-member request queue (Council submits → Admin approves)
- Warning/penalty system with the 1st/2nd/3rd + major-offense ladder
- Transfer flow with the 3-per-week cap
- Nickname editing restricted to Higher Ups/Auths
- General Dashboard video upload flow (currently read-only)
- Fine-grained RLS matching Council/Auths/Higher Ups permissions (current policies
  are intentionally loose — see the comments at the bottom of `schema.sql`)

Reasonable next step: pick one department end-to-end (roster, chats, roles, warnings)
and build it fully before generalizing to every department, since that's where most
of the permission logic lives.
