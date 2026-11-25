-- Idempotent. Safe to run even if 001_init.sql created some of these.
create extension if not exists pgcrypto;

create table if not exists conversations (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, title text, created_at timestamptz default now());
create table if not exists messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references conversations on delete cascade, user_id uuid not null references auth.users on delete cascade, role text not null check (role in ('user','assistant')), content text not null, created_at timestamptz default now());
create table if not exists memories (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, category text not null default 'preference', content text not null, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists tasks (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, title text not null, status text not null default 'pending' check (status in ('pending','running','done','failed','cancelled')), created_at timestamptz default now());
create table if not exists device_commands (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, device_id uuid, action text not null, args jsonb default '{}', status text not null default 'pending_approval' check (status in ('pending_approval','approved','sent','done','failed','rejected')), result text, created_at timestamptz default now());
create table if not exists usage_log (id bigserial primary key, user_id uuid not null references auth.users on delete cascade, model text, input_tokens int, output_tokens int, created_at timestamptz default now());

create index if not exists messages_conv_idx on messages (conversation_id, created_at);
create index if not exists memories_user_idx on memories (user_id, created_at desc);

do $$ declare t text; begin
  foreach t in array array['conversations','messages','memories','tasks','device_commands','usage_log'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "own rows" on %I', t);
    execute format('create policy "own rows" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;
