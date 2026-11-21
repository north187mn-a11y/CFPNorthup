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
          and (
            exists (
              select 1 from public.picks p
              where p.week_id = w.id and p.player_id = auth.uid()
            )
            or exists (
              select 1
              from public.historical_picks p
              join public.historical_players hp on hp.id = p.historical_player_id
              where p.week_id = w.id and hp.league_id = w.league_id
                and hp.user_id = auth.uid()
                and nullif(btrim(p.selected_team_name), '') is not null
            )
          )
        )
      )
  );
$$;
