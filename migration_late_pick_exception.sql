create table public.late_pick_exceptions (
  week_id bigint references public.weeks(id) on delete cascade not null,
  player_id uuid references public.profiles(id) on delete cascade not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (week_id, player_id)
);
alter table public.late_pick_exceptions enable row level security;
revoke all on public.late_pick_exceptions from anon, authenticated;
grant select on public.late_pick_exceptions to authenticated;
create policy "Players view their own late pick exception" on public.late_pick_exceptions
for select to authenticated using (player_id = (select auth.uid()));

-- The sole late-submission path. Direct writes still use the original deadline RLS.
create function public.submit_late_picks(p_week_id bigint, p_picks jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_exception public.late_pick_exceptions%rowtype;
  v_game public.games%rowtype;
  v_team text;
  v_count integer := 0;
  v_now timestamptz := clock_timestamp();
begin
  if v_user is null then raise exception 'Sign in to submit picks.'; end if;
  select * into v_exception from public.late_pick_exceptions
    where week_id = p_week_id and player_id = v_user for update;
  if not found or v_exception.consumed_at is not null or v_exception.expires_at <= v_now then
    raise exception 'Your late-pick exception is closed.';
  end if;
  if not exists (select 1 from public.weeks w join public.league_members m on m.league_id=w.league_id
    where w.id=p_week_id and w.status='OPEN' and m.user_id=v_user) then
    raise exception 'This week is not open for picks.';
  end if;
  if exists (select 1 from public.picks where week_id=p_week_id and player_id=v_user) then
    raise exception 'Your picks have already been submitted.';
  end if;
  if jsonb_typeof(p_picks) is distinct from 'object' then raise exception 'Invalid picks.'; end if;
  -- Hold the game rows while validating and inserting. Kickoff is checked again before commit.
  for v_game in select * from public.games where week_id=p_week_id order by id for share loop
    v_team := p_picks ->> v_game.id::text;
    if v_game.status <> 'SCHEDULED' or v_game.kickoff_at is null or v_game.kickoff_at <= v_now then
      if v_team is not null then raise exception 'A selected game has already started. Refresh your pick sheet.'; end if;
      continue;
    end if;
    if v_team is null or (v_team is distinct from v_game.away_team_id and v_team is distinct from v_game.home_team_id) then
      raise exception 'Please pick a winner for every remaining game.';
    end if;
    insert into public.picks (week_id,game_id,player_id,selected_team_id,selected_team_name,submitted_at)
    values (p_week_id,v_game.id,v_user,v_team,
      case when v_team=v_game.away_team_id then v_game.away_team else v_game.home_team end,v_now);
    v_count := v_count + 1;
  end loop;
  if v_count=0 then raise exception 'No games remain available.'; end if;
  if (select count(*) from jsonb_object_keys(p_picks)) <> v_count then raise exception 'Invalid games in submission.'; end if;
  if exists (select 1 from public.games g join public.picks p on p.game_id=g.id
      where p.week_id=p_week_id and p.player_id=v_user and g.kickoff_at <= clock_timestamp()) then
    raise exception 'A selected game has just started. Refresh your pick sheet.';
  end if;
  update public.late_pick_exceptions set consumed_at=clock_timestamp()
    where week_id=p_week_id and player_id=v_user;
  return v_count;
end;
$$;
revoke all on function public.submit_late_picks(bigint,jsonb) from public, anon;
grant execute on function public.submit_late_picks(bigint,jsonb) to authenticated;
