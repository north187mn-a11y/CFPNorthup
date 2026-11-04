-- Exclude administration-only accounts from survivor score validation.
-- Playing commissioners still count, even if their current-week score is missing.
DO $migration$
DECLARE
  definition text;
  old_clause text := 'IF eligible <> (SELECT count(*) FROM public.league_members lm WHERE lm.league_id=w.league_id AND lm.status::text <> ''ELIMINATED'' AND NOT EXISTS(SELECT 1 FROM public.eliminations e WHERE e.league_id=w.league_id AND e.player_id=lm.user_id))';
  new_clause text := 'IF eligible <> (SELECT count(*) FROM public.league_members lm WHERE lm.league_id=w.league_id AND lm.status::text <> ''ELIMINATED'' AND NOT EXISTS(SELECT 1 FROM public.eliminations e WHERE e.league_id=w.league_id AND e.player_id=lm.user_id) AND (NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=lm.user_id AND p.role::text=''COMMISSIONER'') OR EXISTS(SELECT 1 FROM public.historical_players hp WHERE hp.user_id=lm.user_id AND hp.league_id=w.league_id) OR EXISTS(SELECT 1 FROM public.weekly_scores s JOIN public.weeks sw ON sw.id=s.week_id WHERE s.player_id=lm.user_id AND sw.league_id=w.league_id)))';
BEGIN
  SELECT pg_get_functiondef('public.apply_weekly_cut(bigint,boolean)'::regprocedure) INTO definition;
  IF position(old_clause in definition)=0 THEN
    RAISE EXCEPTION 'Weekly cut validation differs from expected definition';
  END IF;
  EXECUTE replace(definition,old_clause,new_clause);
END
$migration$;