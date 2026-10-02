-- Live scoreboard state cached from ESPN.
alter table public.games add column if not exists period integer;
alter table public.games add column if not exists clock text;
alter table public.games add column if not exists status_detail text;

create or replace function public.update_game_live_state(
  p_game_id bigint, p_status text, p_away_score integer, p_home_score integer,
  p_period integer, p_clock text, p_status_detail text
) returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists (
  select 1 from public.games g join public.weeks w on w.id=g.week_id
  join public.league_members lm on lm.league_id=w.league_id
  where g.id=p_game_id and lm.user_id=auth.uid()
 ) then raise exception 'Not authorized for this game'; end if;
 update public.games set status=p_status::game_status,away_score=p_away_score,home_score=p_home_score,
 period=p_period,clock=p_clock,status_detail=p_status_detail,last_synced_at=now() where id=p_game_id;
end; $$;
grant execute on function public.update_game_live_state(bigint,text,integer,integer,integer,text,text) to authenticated;