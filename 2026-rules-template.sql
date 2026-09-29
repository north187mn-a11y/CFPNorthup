-- Replace YOUR_LEAGUE_UUID with the UUID of the 2026 league.
insert into league_settings (league_id, games_per_week, underdog_bonus_multiplier, finalists_count)
values ('YOUR_LEAGUE_UUID', 15, 0.200, 4);

insert into elimination_rules (league_id, week_number, scoring_basis, eliminate_count, tiebreaker_basis) values
('YOUR_LEAGUE_UUID', 7,  'YTD',    14, 'NONE'),
('YOUR_LEAGUE_UUID', 8,  'WEEKLY', 2,  'YTD'),
('YOUR_LEAGUE_UUID', 9,  'WEEKLY', 2,  'YTD'),
('YOUR_LEAGUE_UUID', 10, 'WEEKLY', 2,  'YTD'),
('YOUR_LEAGUE_UUID', 11, 'WEEKLY', 2,  'YTD'),
('YOUR_LEAGUE_UUID', 12, 'WEEKLY', 1,  'YTD'),
('YOUR_LEAGUE_UUID', 13, 'WEEKLY', 1,  'YTD');
