-- SQL script to create the bets table for your app
create extension if not exists "uuid-ossp";

create table if not exists bets (
  id uuid primary key default uuid_generate_v4(),
  user_address text not null,
  fugitiveId text not null,
  fugitiveName text not null,
  amount float8 not null,
  type text not null,
  odds float8 not null,
  potentialWin float8 not null,
  status text not null,
  timestamp timestamptz not null
);

-- Optional: create an index for faster queries by fugitiveId
create index if not exists idx_bets_fugitiveId on bets(fugitiveId);

-- Optional: create an index for faster queries by user_address
create index if not exists idx_bets_user_address on bets(user_address);