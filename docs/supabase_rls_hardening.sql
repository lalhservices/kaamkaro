-- Kaam Karo RLS hardening patch for an already-created Supabase project.
-- Run this once after backend/supabase_schema.sql if profile reads, chats,
-- messages, applicants, or public employer profile views are blocked by RLS.
--
-- This does NOT require or expose the service role key in frontend code.
-- It keeps writes scoped to the authenticated owner/participant while allowing:
-- - employers to read worker profiles only for applicants on their own jobs
-- - workers to read public employer profiles for active jobs / their applications
-- - chats/messages to be visible only to match participants

create or replace function public.owns_worker_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.worker_profiles
    where id = profile_id and user_id = auth.uid()
  );
$$;

create or replace function public.owns_employer_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.employer_profiles
    where id = profile_id and user_id = auth.uid()
  );
$$;

drop policy if exists "worker_profiles_select_allowed" on public.worker_profiles;
create policy "worker_profiles_select_allowed" on public.worker_profiles
for select using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.applications a
    where a.worker_id = worker_profiles.id
      and public.owns_employer_profile(a.employer_id)
  )
);

drop policy if exists "employer_profiles_select_allowed" on public.employer_profiles;
create policy "employer_profiles_select_allowed" on public.employer_profiles
for select using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.jobs j
    where j.employer_id = employer_profiles.id
      and j.status = 'active'
  )
  or exists (
    select 1 from public.applications a
    where a.employer_id = employer_profiles.id
      and public.owns_worker_profile(a.worker_id)
  )
);

drop policy if exists "jobs_manage_own_employer" on public.jobs;
create policy "jobs_manage_own_employer" on public.jobs
for all using (public.owns_employer_profile(jobs.employer_id))
with check (public.owns_employer_profile(jobs.employer_id));

drop policy if exists "applications_select_participants" on public.applications;
create policy "applications_select_participants" on public.applications
for select using (
  public.is_admin()
  or public.owns_worker_profile(applications.worker_id)
  or public.owns_employer_profile(applications.employer_id)
);

drop policy if exists "applications_worker_insert_own" on public.applications;
create policy "applications_worker_insert_own" on public.applications
for insert with check (public.owns_worker_profile(worker_id));

drop policy if exists "applications_participant_update" on public.applications;
create policy "applications_participant_update" on public.applications
for update using (
  public.is_admin()
  or public.owns_worker_profile(applications.worker_id)
  or public.owns_employer_profile(applications.employer_id)
) with check (
  public.is_admin()
  or public.owns_worker_profile(worker_id)
  or public.owns_employer_profile(employer_id)
);

drop policy if exists "chats_participants" on public.chats;
create policy "chats_participants" on public.chats
for all using (
  public.is_admin()
  or public.owns_worker_profile(chats.worker_id)
  or public.owns_employer_profile(chats.employer_id)
) with check (
  public.is_admin()
  or public.owns_worker_profile(worker_id)
  or public.owns_employer_profile(employer_id)
);

drop policy if exists "messages_chat_participants" on public.messages;
create policy "messages_chat_participants" on public.messages
for all using (
  public.is_admin()
  or exists (
    select 1 from public.chats c
    where c.id = messages.chat_id
      and (public.owns_worker_profile(c.worker_id) or public.owns_employer_profile(c.employer_id))
  )
) with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.chats c
    where c.id = chat_id
      and (public.owns_worker_profile(c.worker_id) or public.owns_employer_profile(c.employer_id))
  )
);

create or replace function public.update_message_delivery_status(message_id uuid, new_status text)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_message public.messages;
begin
  if new_status not in ('sent', 'delivered', 'seen') then
    raise exception 'Invalid delivery status';
  end if;

  if not exists (
    select 1
    from public.messages m
    join public.chats c on c.id = m.chat_id
    where m.id = message_id
      and (
        public.owns_worker_profile(c.worker_id)
        or public.owns_employer_profile(c.employer_id)
        or public.is_admin()
      )
  ) then
    raise exception 'Not allowed';
  end if;

  update public.messages
  set
    delivery_status = new_status,
    seen_at = case when new_status = 'seen' then now() else seen_at end
  where id = message_id
  returning * into updated_message;

  return updated_message;
end;
$$;

drop policy if exists "saved_jobs_own" on public.saved_jobs;
create policy "saved_jobs_own" on public.saved_jobs
for all using (public.owns_worker_profile(saved_jobs.worker_id))
with check (public.owns_worker_profile(worker_id));

drop policy if exists "moderation_logs_insert_own" on public.moderation_logs;
create policy "moderation_logs_insert_own" on public.moderation_logs
for insert with check (user_id = auth.uid());
