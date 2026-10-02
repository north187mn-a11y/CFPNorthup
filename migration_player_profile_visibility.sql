-- Allow authenticated league members to see the names of other members in their league.
-- This fixes player-facing standings/pick tables falling back to "Player" when
-- profiles.full_name was hidden by the old self-only SELECT policy.

drop policy if exists "League members can view player profiles" on public.profiles;

create policy "League members can view player profiles"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.league_members me
    join public.league_members them
      on them.league_id = me.league_id
    where me.user_id = auth.uid()
      and them.user_id = profiles.id
  )
);
