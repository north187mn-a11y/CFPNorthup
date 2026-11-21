create schema if not exists private;

create or replace function private.can_view_week_picks(target_week_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.weeks w
    where w.id = target_week_id
      and auth.uid() is not null
      and (
        (w.pick_deadline is not null and now() >= w.pick_deadline)
        or (w.pick_deadline is null and w.status = 'COMPLETE')
      )
      and (
        public.can_manage_league(w.league_id)
        or (
          public.is_league_member(w.league_id)
          and exists (select 1 from public.games g where g.week_id = w.id)
          and not exists (
            select 1 from public.games g
            where g.week_id = w.id
              and not exists (
                select 1 from public.picks p
                where p.week_id = w.id and p.game_id = g.id
                  and p.player_id = auth.uid()
                  and p.selected_team_id in (g.away_team_id, g.home_team_id)
              )
              and not exists (
                select 1
                from public.historical_picks p
                join public.historical_players hp on hp.id = p.historical_player_id
                where p.week_id = w.id and p.game_number = g.game_number
                  and hp.league_id = w.league_id and hp.user_id = auth.uid()
                  and nullif(btrim(p.selected_team_name), '') is not null
              )
          )
        )
      )
  );
$$;

revoke all on function private.can_view_week_picks(bigint) from public, anon;
grant execute on function private.can_view_week_picks(bigint) to authenticated;
grant usage on schema private to authenticated;

create or replace function public.can_view_week_picks(target_week_id bigint)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.can_view_week_picks(target_week_id);
$$;

revoke all on function public.can_view_week_picks(bigint) from public, anon;
grant execute on function public.can_view_week_picks(bigint) to authenticated;

alter policy "Players can view picks after deadline" on public.picks
  using (private.can_view_week_picks(week_id));

alter policy "League members can view historical picks" on public.historical_picks
  using (
    private.can_view_week_picks(week_id)
    or exists (
      select 1 from public.historical_players hp
      join public.weeks w on w.id = historical_picks.week_id and w.league_id = hp.league_id
      where hp.id = historical_picks.historical_player_id and hp.user_id = (select auth.uid())
    )
  );
