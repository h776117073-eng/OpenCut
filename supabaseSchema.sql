-- Users table
create table if not exists users (
  id text primary key,
  email text unique,
  display_name text,
  created_at timestamptz not null default now()
);

-- Projects table
create table if not exists projects (
  id text primary key,
  user_id text not null references users(id),
  name text not null,
  thumbnail_uri text,
  clips jsonb not null default '[]',
  text_clips jsonb not null default '[]',
  audio_clips jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Templates table
create table if not exists templates (
  id text primary key,
  user_id text not null references users(id),
  name text not null,
  description text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists projects enable row level security;
alter table if exists templates enable row level security;
alter table if exists users enable row level security;

create policy if not exists "Users can manage own users row" on users
  for select using (auth.uid()::text = id);
create policy if not exists "Users can update own users row" on users
  for update using (auth.uid()::text = id);
create policy if not exists "Users can insert own users row" on users
  for insert with check (auth.uid()::text = id);

create policy if not exists "Users can manage their projects" on projects
  for all using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

create policy if not exists "Users can manage their templates" on templates
  for all using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);
