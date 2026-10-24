-- Prevent concurrent game finals from overwriting weekly totals.
-- Preserve existing signatures, authorization, search paths, and grants.
CREATE OR REPLACE FUNCTION public.recalculate_game_scoring(p_game_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare g record;
begin
 select * into g from public.games where id=p_game_id;
 if g.id is null then raise exception 'Game not found'; end if;
 -- Serialize every scoring transaction for a week before reading aggregates.
 perform pg_advisory_xact_lock(hashtextextended('survivor:week-score:' || g.week_id::text, 0));
 -- Read again after waiting so this calculation includes prior committed updates.
 select * into g from public.games where id=p_game_id;
 if g.id is null then raise exception 'Game not found'; end if;
 if g.status <> 'FINAL'::game_status then return; end if;
 if g.commissioner_override then
   g.winner_team_id := g.override_winner_team_id;
 elsif g.away_score is not null and g.home_score is not null and g.away_score <> g.home_score then
   g.winner_team_id := case when g.away_score > g.home_score then g.away_team_id else g.home_team_id end;
 else
   return;
 end if;
 update public.games set winner_team_id=g.winner_team_id where id=p_game_id;
 insert into public.pick_results(pick_id,correct,was_favorite,spread,points,calculated_at)
 select p.id,
        p.selected_team_id=g.winner_team_id,
        p.selected_team_id=g.favorite_team_id,
        g.locked_spread,
        case when p.selected_team_id<>g.winner_team_id then 0
             when p.selected_team_id=g.favorite_team_id then coalesce(g.favorite_points,1)
             else coalesce(g.underdog_points,1) end,
        now()
 from public.picks p where p.game_id=p_game_id
 on conflict(pick_id) do update set correct=excluded.correct,was_favorite=excluded.was_favorite,spread=excluded.spread,points=excluded.points,calculated_at=excluded.calculated_at;

 insert into public.weekly_scores(week_id,player_id,points,calculated_at)
 select p.week_id,p.player_id,
        coalesce(sum(case when gm.status='FINAL'::game_status then coalesce(pr.points,0) else 0 end),0),
        now()
 from public.picks p
 join public.games gm on gm.id=p.game_id
 left join public.pick_results pr on pr.pick_id=p.id
 where p.week_id=g.week_id
 group by p.week_id,p.player_id
 on conflict(week_id,player_id) do update set points=excluded.points,calculated_at=excluded.calculated_at;
end; $function$;

CREATE OR REPLACE FUNCTION public.update_game_live_state(p_game_id bigint, p_status text, p_away_score integer, p_home_score integer, p_period integer, p_clock text, p_status_detail text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_override boolean; v_week_id bigint;
begin
 if not exists(select 1 from public.games g join public.weeks w on w.id=g.week_id join public.league_members lm on lm.league_id=w.league_id where g.id=p_game_id and lm.user_id=auth.uid()) then raise exception 'Not authorized for this game'; end if;
 select week_id into v_week_id from public.games where id=p_game_id;
 -- Take the same week lock before any game-row write to keep lock order consistent.
 perform pg_advisory_xact_lock(hashtextextended('survivor:week-score:' || v_week_id::text, 0));
 select commissioner_override into v_override from public.games where id=p_game_id;
 if v_override then return; end if;
 update public.games set status=p_status::game_status,away_score=p_away_score,home_score=p_home_score,period=p_period,clock=p_clock,status_detail=p_status_detail,last_synced_at=now(),
 winner_team_id=case when p_status='FINAL' and p_away_score<>p_home_score then case when p_away_score>p_home_score then away_team_id else home_team_id end else winner_team_id end
 where id=p_game_id;
 if p_status='FINAL' then perform public.recalculate_game_scoring(p_game_id); end if;
end; $function$;
