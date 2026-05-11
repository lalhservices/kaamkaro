-- Kaam Karo RLS patch for projects where the first schema was already run.
-- Run this once in Supabase SQL Editor if worker_profiles/employer_profiles return:
-- "infinite recursion detected in policy".

drop policy if exists "worker_profiles_select_allowed" on public.worker_profiles;
create policy "worker_profiles_select_allowed" on public.worker_profiles
for select using (
  user_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "employer_profiles_select_allowed" on public.employer_profiles;
create policy "employer_profiles_select_allowed" on public.employer_profiles
for select using (
  user_id = auth.uid()
  or public.is_admin()
);
