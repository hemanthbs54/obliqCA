-- Extensions
create extension if not exists vector;
create extension if not exists pgcrypto;

-- One row per authenticated user, 1:1 with auth.users.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  firm_name text,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A CA firm's client (the entity being tracked for compliance).
create table clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  client_type text not null default 'individual'
    check (client_type in ('individual', 'proprietorship', 'partnership', 'llp', 'company')),
  pan text,
  gstin text,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clients_owner_id_idx on clients(owner_id);

-- Reference catalog of filing types (GST/TDS/ITR). Seeded, not user-editable.
create table filing_types (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category text not null check (category in ('GST', 'TDS', 'ITR')),
  frequency text not null check (frequency in ('monthly', 'quarterly', 'annually')),
  description text,
  created_at timestamptz not null default now()
);
