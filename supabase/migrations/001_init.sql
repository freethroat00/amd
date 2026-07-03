-- Salary Calculator - Supabase Migration
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  role text default 'user' check (role in ('admin', 'user')),
  created_at timestamptz default now()
);

-- Months data
create table public.months (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  year integer not null,
  month integer not null,
  data jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, year, month)
);

-- Notes
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.months enable row level security;
alter table public.notes enable row level security;

-- Profiles: users can read all, update own
create policy "Users can view all profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Months: users can CRUD own data
create policy "Users can view own months" on public.months for select using (auth.uid() = user_id);
create policy "Users can insert own months" on public.months for insert with check (auth.uid() = user_id);
create policy "Users can update own months" on public.months for update using (auth.uid() = user_id);
create policy "Users can delete own months" on public.months for delete using (auth.uid() = user_id);

-- Notes: users can CRUD own notes
create policy "Users can view own notes" on public.notes for select using (auth.uid() = user_id);
create policy "Users can insert own notes" on public.notes for insert with check (auth.uid() = user_id);
create policy "Users can update own notes" on public.notes for update using (auth.uid() = user_id);
create policy "Users can delete own notes" on public.notes for delete using (auth.uid() = user_id);

-- Admin can see everything (for dashboard)
create policy "Admins can view all months" on public.months for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can view all notes" on public.notes for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes
create index idx_months_user_id on public.months(user_id);
create index idx_notes_user_id on public.notes(user_id);
