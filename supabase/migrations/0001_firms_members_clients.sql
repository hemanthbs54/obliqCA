-- Tenancy core: every business row belongs to exactly one firm, and a user
-- belongs to exactly one firm with exactly one role. The firm a request acts
-- as is always derived from auth.uid() inside the database — never from a
-- value the client sends.

create extension if not exists pgcrypto with schema extensions;

create type public.member_role as enum ('staff', 'reviewer', 'partner');

create table public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

-- One membership per user (user_id is the PK): a user can never be in two
-- firms, which keeps "which firm am I acting as?" unambiguous.
create table public.firm_memberships (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  firm_id uuid not null references public.firms (id) on delete cascade,
  role public.member_role not null,
  created_at timestamptz not null default now(),
  unique (firm_id, user_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 200),
  pan text check (pan is null or pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
  gstin text check (gstin is null or gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$'),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (firm_id, id),
  unique (firm_id, name)
);

-- Staff only see clients they are assigned to. Composite FKs make it
-- impossible to assign a user from one firm to another firm's client.
create table public.client_assignments (
  client_id uuid not null,
  user_id uuid not null,
  firm_id uuid not null,
  assigned_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (client_id, user_id),
  foreign key (firm_id, client_id) references public.clients (firm_id, id) on delete cascade,
  foreign key (firm_id, user_id) references public.firm_memberships (firm_id, user_id) on delete cascade
);

create index client_assignments_user_idx on public.client_assignments (user_id);

-- ---------------------------------------------------------------------------
-- Identity helpers used by RLS policies and workflow functions. SECURITY
-- DEFINER so policies can call them without recursing into RLS.
-- ---------------------------------------------------------------------------

create function public.current_firm_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select firm_id from public.firm_memberships where user_id = auth.uid()
$$;

create function public.current_member_role()
returns public.member_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.firm_memberships where user_id = auth.uid()
$$;

create function public.can_access_client(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clients c
    join public.firm_memberships m on m.firm_id = c.firm_id and m.user_id = auth.uid()
    where c.id = p_client_id
      and (
        m.role in ('reviewer', 'partner')
        or exists (
          select 1 from public.client_assignments a
          where a.client_id = c.id and a.user_id = auth.uid()
        )
      )
  )
$$;
