create extension if not exists pgcrypto;

do $$ begin
  create type user_role as enum ('PLAYER','COMMISSIONER');
exception when duplicate_object then null; end $$;
do $$ begin
  create type member_status as enum ('ACTIVE','ELIMINATED','FINALIST','CHAMPION');
exception when duplicate_object then null; end $$;
do $$ begin
  create type week_type as enum ('REGULAR','FINAL');
exception when duplicate_object then null; end $$;
do $$ begin
  create type week_status as enum ('DRAFT','OPEN','LOCKED','SCORING','COMPLETE');
exception when duplicate_object then null; end $$;
do $$ begin
  create type game_status as enum ('SCHEDULED','IN_PROGRESS','FINAL','POSTPONED','CANCELED');
exception when duplicate_object then null; end $$;

create table if not exists leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  season integer not null,
  commissioner_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  role user_role not null default 'PLAYER',
  created_at timestamptz not null default now()
);

alter table leagues add constraint leagues_commissioner_fk foreign key (commissioner_id) references profiles(id) on delete set null;

create table if not exists league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status member_status not null default 'ACTIVE',
  joined_at timestamptz not null default now(),
  unique (league_id, user_id)
);

create table if not exists weeks (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  week_number integer not null,
  type week_type not null default 'REGULAR',
  status week_status not null default 'DRAFT',
  pick_deadline timestamptz,
  unique (league_id, week_number)
);

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references weeks(id) on delete cascade,
  game_number integer not null,
  espn_event_id text,
  away_team text not null,
  away_team_id text,
  home_team text not null,
  home_team_id text,
  away_spread numeric(5,2) not null,
  home_spread numeric(5,2) not null,
  status game_status not null default 'SCHEDULED',
  away_score integer,
  home_score integer,
  winner text check (winner in ('home','away')),
  source_url text,
  last_synced_at timestamptz,
  unique (week_id, game_number)
);

create table if not exists picks (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references weeks(id) on delete cascade,
  game_id uuid not null references games(id) on delete cascade,
  player_id uuid not null references profiles(id) on delete cascade,
  selected_side text not null check (selected_side in ('home','away')),
  submitted_at timestamptz not null default now(),
  unique (game_id, player_id)
);

create table if not exists pick_results (
  id uuid primary key default gen_random_uuid(),
  pick_id uuid not null unique references picks(id) on delete cascade,
  correct boolean not null default false,
  favorite boolean,
  spread numeric(5,2),
  points numeric(8,2) not null default 0
);

create table if not exists weekly_scores (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references weeks(id) on delete cascade,
  player_id uuid not null references profiles(id) on delete cascade,
  points numeric(10,2) not null default 0,
  rank integer,
  unique (week_id, player_id)
);

create table if not exists eliminations (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  week_id uuid not null references weeks(id) on delete cascade,
  player_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  rank integer,
  created_at timestamptz not null default now()
);

create index if not exists games_week_idx on games(week_id);
create index if not exists games_espn_idx on games(espn_event_id);
create index if not exists picks_week_player_idx on picks(week_id, player_id);
create index if not exists scores_week_idx on weekly_scores(week_id);

-- YTD includes every league member. Survivor elimination does not end league
-- participation or stop a player from accumulating season-long points.
create or replace view player_ytd_scores as
select
  lm.league_id,
  ws.player_id,
  coalesce(sum(ws.points),0)::numeric(10,2) as ytd_points
from league_members lm
left join weekly_scores ws on ws.player_id = lm.user_id
group by lm.league_id, ws.player_id;

create table if not exists league_settings (
  league_id uuid primary key references leagues(id) on delete cascade,
  games_per_week integer not null default 15,
  underdog_bonus_multiplier numeric(5,3) not null default 0.200,
  finalists_count integer not null default 4,
  created_at timestamptz not null default now()
);

create table if not exists elimination_rules (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  week_number integer not null,
  scoring_basis text not null check (scoring_basis in ('YTD','WEEKLY')),
  eliminate_count integer not null check (eliminate_count > 0),
  tiebreaker_basis text check (tiebreaker_basis in ('YTD','NONE')),
  unique (league_id, week_number)
);

-- 2026 rules for the current league. These are data, not application logic.
-- Insert these rows for the 2026 league after creating its league ID.
