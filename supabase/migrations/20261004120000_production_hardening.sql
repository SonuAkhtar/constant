alter table public.habits drop constraint if exists habits_title_len;
alter table public.habits add constraint habits_title_len
  check (char_length(btrim(title)) between 1 and 60) not valid;

alter table public.habits drop constraint if exists habits_time_slot_valid;
alter table public.habits add constraint habits_time_slot_valid
  check (time_slot in ('morning', 'afternoon', 'evening', 'night')) not valid;

alter table public.habits drop constraint if exists habits_frequency_valid;
alter table public.habits add constraint habits_frequency_valid
  check (frequency in ('daily', 'weekdays', 'custom')) not valid;

alter table public.habits drop constraint if exists habits_custom_days_valid;
alter table public.habits add constraint habits_custom_days_valid
  check (custom_days <@ array[0, 1, 2, 3, 4, 5, 6]) not valid;

alter table public.habits drop constraint if exists habits_text_len;
alter table public.habits add constraint habits_text_len
  check (char_length(coalesce(description, '')) <= 200
     and char_length(coalesce(intention, '')) <= 200
     and char_length(icon) <= 40) not valid;

alter table public.habits drop constraint if exists habits_reminder_time_valid;
alter table public.habits add constraint habits_reminder_time_valid
  check (reminder_time is null or reminder_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') not valid;

alter table public.habit_logs drop constraint if exists habit_logs_date_valid;
alter table public.habit_logs add constraint habit_logs_date_valid
  check (date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$') not valid;

alter table public.habit_logs drop constraint if exists habit_logs_skip_reason_valid;
alter table public.habit_logs add constraint habit_logs_skip_reason_valid
  check (skip_reason is null or skip_reason in ('sick', 'no-time', 'rest')) not valid;

alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username ~ '^[a-z0-9_]{3,20}$') not valid;

alter table public.profiles drop constraint if exists profiles_user_name_len;
alter table public.profiles add constraint profiles_user_name_len
  check (char_length(user_name) <= 60) not valid;

create index if not exists habit_logs_user_date_idx on public.habit_logs (user_id, date);
drop index if exists public.habit_logs_user_idx;

drop policy if exists "own logs" on public.habit_logs;
create policy "own logs" on public.habit_logs
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid())
  );

alter table public.habit_logs add column if not exists updated_at timestamptz not null default now();

create or replace function public.upsert_habit_logs(logs jsonb)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.habit_logs
    (user_id, habit_id, date, completed, skipped, skip_reason, completed_at, updated_at)
  select
    auth.uid(),
    (l->>'habit_id')::uuid,
    l->>'date',
    coalesce((l->>'completed')::boolean, false),
    coalesce((l->>'skipped')::boolean, false),
    l->>'skip_reason',
    (l->>'completed_at')::timestamptz,
    coalesce((l->>'updated_at')::timestamptz, now())
  from jsonb_array_elements(logs) as l
  on conflict (habit_id, date) do update set
    completed    = excluded.completed,
    skipped      = excluded.skipped,
    skip_reason  = excluded.skip_reason,
    completed_at = excluded.completed_at,
    updated_at   = excluded.updated_at
  where public.habit_logs.updated_at <= excluded.updated_at;
$$;

revoke all on function public.upsert_habit_logs(jsonb) from public, anon;
grant execute on function public.upsert_habit_logs(jsonb) to authenticated;

create table if not exists public.user_settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  settings   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_settings_size check (pg_column_size(settings) < 262144)
);

alter table public.user_settings enable row level security;
drop policy if exists "own settings" on public.user_settings;
create policy "own settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.goals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  text       text not null check (char_length(btrim(text)) between 1 and 120),
  set_date   text not null check (set_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  habit_id   uuid references public.habits(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists goals_user_idx on public.goals (user_id);

alter table public.goals enable row level security;
drop policy if exists "own goals" on public.goals;
create policy "own goals" on public.goals
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (habit_id is null
         or exists (select 1 from public.habits h where h.id = habit_id and h.user_id = auth.uid()))
  );

do $$
declare
  p record;
  parsed jsonb;
  g jsonb;
  uuid_re constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  for p in
    select user_id, goal, goal_set_date from public.profiles
    where coalesce(goal, '') <> ''
      and not exists (select 1 from public.goals x where x.user_id = profiles.user_id)
  loop
    begin
      if left(btrim(p.goal), 1) = '[' then
        parsed := p.goal::jsonb;
      else
        parsed := jsonb_build_array(jsonb_build_object('text', p.goal));
      end if;
    exception when others then
      continue;
    end;

    for g in select * from jsonb_array_elements(parsed) loop
      continue when coalesce(btrim(g->>'text'), '') = '';
      insert into public.goals (id, user_id, text, set_date, habit_id)
      values (
        case when (g->>'id') ~* uuid_re then (g->>'id')::uuid else gen_random_uuid() end,
        p.user_id,
        left(btrim(g->>'text'), 120),
        coalesce(
          nullif(substring(g->>'setDate' from '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'), ''),
          nullif(substring(p.goal_set_date from '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'), ''),
          to_char(now(), 'YYYY-MM-DD')
        ),
        (select h.id from public.habits h
          where h.user_id = p.user_id and h.id::text = g->>'habitId')
      )
      on conflict (id) do nothing;
    end loop;
  end loop;
end $$;

create table if not exists public.login_attempts (
  id           bigserial primary key,
  key          text not null,
  attempted_at timestamptz not null default now()
);
create index if not exists login_attempts_key_time_idx on public.login_attempts (key, attempted_at);
alter table public.login_attempts enable row level security;
