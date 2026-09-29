# College Football Picks

First MVP scaffold for the college football prediction/elimination league.

## League rules represented
- 15 games selected each regular week.
- Correct favorite pick: 1 point.
- Correct underdog pick: `1 + 0.2 * absolute locked spread`.
- Incorrect pick: 0.
- The spread stored on `games` is the authoritative locked spread.
- ESPN event IDs are stored separately and used only to determine game results.
- 2026 elimination structure: 28→14 after Week 7; 14→12→10→8→6 after Weeks 8–11; 6→5→4 after Weeks 12–13.
- Finals are represented by a special `FINAL` week. Final scoring rules can be configured once confirmed.

## Stack
Next.js + TypeScript + Supabase/Postgres + server-side ESPN HTML parsing.

## Setup
1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local` and add the Supabase URL, anon key, and service-role key.
4. `npm install`
5. `npm run dev`
6. Open `/commissioner` and test `/api/espn/401858461`.

## ESPN integration
`lib/espn.ts` reads the scoreboard table using the semantic `data-testid` attributes shown in the ESPN HTML:
- `prism-TableRow`
- `prism-TableCell`
- team links containing `/college-football/team/`

It stores team IDs, scores, status, and winner. The code also has a title/meta fallback if ESPN changes the table markup.

For production, the ESPN sync should run from a server/cron job rather than from the player's browser. A failed or ambiguous parse must not finalize a game.
