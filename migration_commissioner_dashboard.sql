-- Run this AFTER the original schema.sql already installed in Supabase.
-- Adds the team-specific scoring fields needed by the commissioner dashboard.
alter table public.games add column if not exists favorite_team_id text;
alter table public.games add column if not exists favorite_team_name text;
alter table public.games add column if not exists underdog_team_id text;
alter table public.games add column if not exists underdog_team_name text;
alter table public.games add column if not exists favorite_points numeric(8,2) not null default 1.00;
alter table public.games add column if not exists underdog_points numeric(8,2);
alter table public.games add column if not exists winner_team_id text;
alter table public.games add column if not exists source_url text;
alter table public.games add column if not exists last_synced_at timestamptz;

update public.games
set underdog_points = round((1 + 0.2 * abs(locked_spread))::numeric, 2)
where underdog_points is null and locked_spread is not null;

-- Commissioner-only write access for the dashboard.
create policy "Commissioner can create weeks"
on public.weeks
for insert
to authenticated
with check (
  league_id in (
    select id from public.leagues where commissioner_id = auth.uid()
  )
);

create policy "Commissioner can update weeks"
on public.weeks
for update
to authenticated
using (
  league_id in (
    select id from public.leagues where commissioner_id = auth.uid()
  )
)
with check (
  league_id in (
    select id from public.leagues where commissioner_id = auth.uid()
  )
);

create policy "Commissioner can create games"
on public.games
for insert
to authenticated
with check (
  week_id in (
    select w.id
    from public.weeks w
    join public.leagues l on l.id = w.league_id
    where l.commissioner_id = auth.uid()
  )
);

create policy "Commissioner can update games"
on public.games
for update
to authenticated
using (
  week_id in (
    select w.id
    from public.weeks w
    join public.leagues l on l.id = w.league_id
    where l.commissioner_id = auth.uid()
  )
)
with check (
  week_id in (
    select w.id
    from public.weeks w
    join public.leagues l on l.id = w.league_id
    where l.commissioner_id = auth.uid()
  )
);

create policy "Commissioner can create pick results"
on public.pick_results
for insert
to authenticated
with check (
  exists (
    select 1
    from public.picks p
    join public.weeks w on w.id = p.week_id
    join public.leagues l on l.id = w.league_id
    where p.id = pick_id and l.commissioner_id = auth.uid()
  )
);

create policy "Commissioner can update pick results"
on public.pick_results
for update
to authenticated
using (
  exists (
    select 1
    from public.picks p
    join public.weeks w on w.id = p.week_id
    join public.leagues l on l.id = w.league_id
    where p.id = pick_id and l.commissioner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.picks p
    join public.weeks w on w.id = p.week_id
    join public.leagues l on l.id = w.league_id
    where p.id = pick_id and l.commissioner_id = auth.uid()
  )
);

create policy "Commissioner can create weekly scores"
on public.weekly_scores
for insert
to authenticated
with check (
  week_id in (
    select w.id from public.weeks w join public.leagues l on l.id=w.league_id where l.commissioner_id=auth.uid()
  )
);

create policy "Commissioner can update weekly scores"
on public.weekly_scores
for update
to authenticated
using (
  week_id in (select w.id from public.weeks w join public.leagues l on l.id=w.league_id where l.commissioner_id=auth.uid())
)
with check (
  week_id in (select w.id from public.weeks w join public.leagues l on l.id=w.league_id where l.commissioner_id=auth.uid())
);
