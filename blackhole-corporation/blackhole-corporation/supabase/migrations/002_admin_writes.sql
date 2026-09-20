-- ============================================================
-- Migration: allow Higher Ups to create Mains and Departments
-- Run this in Supabase SQL Editor (schema.sql already ran earlier
-- only granted reads — this adds the first writes).
-- ============================================================

create policy "higher ups can create mains"
  on public.mains for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.higher_up_rank is not null
    )
  );

create policy "higher ups can create departments"
  on public.departments for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.higher_up_rank is not null
    )
  );

-- Read-your-own-profile-rank is already covered by the "read profiles" policy
-- from schema.sql, so the exists() checks above work as-is.
