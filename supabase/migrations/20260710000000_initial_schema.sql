create table if not exists public.profiles (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  user_name            text        not null default '',
  username             text        not null unique,
  email                text,
  focuses              text[]      not null default '{}',
  goal                 text        not null default '',
  goal_set_date        text        not null default '',
  onboarding_completed boolean     not null default false,
  updated_at           timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

create table if not exists public.habits (
  id            uuid primary key,
  user_id       uuid    not null references auth.users(id) on delete cascade,
  title         text    not null,
  icon          text    not null,
  time_slot     text    not null,
  description   text,
  intention     text,
  frequency     text    not null default 'daily',
  custom_days   int[]   not null default '{}',
  reminder_time text,
  is_archived   boolean not null default false,
  is_pinned     boolean not null default false,
  is_custom     boolean not null default true,
  sort_order    int     not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists habits_user_idx on public.habits (user_id);

create table if not exists public.habit_logs (
  user_id      uuid    not null references auth.users(id) on delete cascade,
  habit_id     uuid    not null references public.habits(id) on delete cascade,
  date         text    not null,
  completed    boolean not null default false,
  skipped      boolean not null default false,
  skip_reason  text,
  completed_at timestamptz,
  primary key (habit_id, date)
);
create index if not exists habit_logs_user_idx on public.habit_logs (user_id);

create table if not exists public.milestones (
  user_id uuid not null references auth.users(id) on delete cascade,
  type    text not null,
  message text not null,
  date    text not null,
  primary key (user_id, type)
);

alter table public.profiles   enable row level security;
alter table public.habits     enable row level security;
alter table public.habit_logs enable row level security;
alter table public.milestones enable row level security;

drop policy if exists "own profile"   on public.profiles;
drop policy if exists "own habits"     on public.habits;
drop policy if exists "own logs"       on public.habit_logs;
drop policy if exists "own milestones" on public.milestones;

create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own habits" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own logs" on public.habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own milestones" on public.milestones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.username_exists(uname text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where lower(username) = lower(uname));
$$;

grant execute on function public.username_exists(text) to anon, authenticated;

drop function if exists public.email_for_username(text);
