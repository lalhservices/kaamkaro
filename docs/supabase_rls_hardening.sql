-- Kaam Karo RLS hardening patch for an already-created Supabase project.
-- Run this once after backend/supabase_schema.sql if profile reads, chats,
-- messages, applicants, or public employer profile views are blocked by RLS.
--
-- This does NOT require or expose the service role key in frontend code.
-- It keeps writes scoped to the authenticated owner/participant while allowing:
-- - employers to read worker profiles only for applicants on their own jobs
-- - workers to read public employer profiles for active jobs / their applications
-- - chats/messages to be visible only to match participants
-- It also refreshes production job posting guards:
-- - one free active job
-- - one free post per 30 days
-- - free jobs expire in 15 days
-- - boosted jobs expire in 28 days
-- - duplicate job title + description is blocked per employer

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

create or replace function public.enforce_job_posting_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_free_count integer;
  recent_free_count integer;
  duplicate_count integer;
begin
  if new.post_type = 'boosted' then
    new.boosted := true;
    new.expires_at := coalesce(new.expires_at, now() + interval '28 days');
  else
    new.boosted := false;
    new.expires_at := coalesce(new.expires_at, now() + interval '15 days');

    if tg_op = 'INSERT' then
      select count(*) into active_free_count
      from public.jobs
      where employer_id = new.employer_id
        and post_type = 'free'
        and status in ('active', 'pending_review')
        and deleted_at is null
        and coalesce(expires_at, now() + interval '1 day') > now();

      if active_free_count >= 1 then
        raise exception 'free_job_active_limit';
      end if;

      select count(*) into recent_free_count
      from public.jobs
      where employer_id = new.employer_id
        and post_type = 'free'
        and created_at > now() - interval '30 days';

      if recent_free_count >= 1 then
        raise exception 'free_job_30_day_limit';
      end if;
    end if;
  end if;

  select count(*) into duplicate_count
  from public.jobs
  where employer_id = new.employer_id
    and (tg_op = 'INSERT' or id <> new.id)
    and lower(trim(title)) = lower(trim(new.title))
    and lower(trim(description)) = lower(trim(new.description))
    and status not in ('deleted', 'removed', 'rejected');

  if duplicate_count >= 1 then
    raise exception 'duplicate_job_post';
  end if;

  return new;
end;
$$;

drop trigger if exists jobs_enforce_posting_rules on public.jobs;
create trigger jobs_enforce_posting_rules
before insert or update on public.jobs
for each row execute function public.enforce_job_posting_rules();

alter table public.audit_logs add column if not exists phone_number text;
alter table public.audit_logs add column if not exists device_fingerprint text;
alter table public.audit_logs add column if not exists risk_reason text;
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_phone_number on public.audit_logs(phone_number);
create index if not exists idx_jobs_employer_post_type_created on public.jobs(employer_id, post_type, created_at);

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
