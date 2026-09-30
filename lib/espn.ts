import * as cheerio from 'cheerio';

export type ESPNTeamResult = { name: string; id: string; score: number | null };
export type ESPNGame = {
  eventId: string;
  status: 'scheduled' | 'in_progress' | 'final' | 'unknown';
  teams: ESPNTeamResult[];
  winnerTeamId: string | null;
  sourceUrl: string;
};

function statusFromText(text: string): ESPNGame['status'] {
  const t = text.toLowerCase();
  if (/\bfinal\b/.test(t)) return 'final';
  if (t.includes('in progress') || t.includes('live') || /\bq[1-4]\b/.test(t) || t.includes('quarter')) return 'in_progress';
  if (t.includes('scheduled') || t.includes('upcoming')) return 'scheduled';
  return 'unknown';
}

export async function fetchESPNGame(eventId: string): Promise<ESPNGame> {
  const sourceUrl = `https://www.espn.com/college-football/game/_/gameId/${encodeURIComponent(eventId)}`;
  const response = await fetch(sourceUrl, { cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!response.ok) throw new Error(`ESPN returned ${response.status}`);
  const html = await response.text();
  const $ = cheerio.load(html);

  const teams: ESPNTeamResult[] = [];
  $('tr[data-testid="prism-TableRow"]').each((_, row) => {
    const link = $(row).find('a[href*="/college-football/team/"]').first();
    const name = link.text().trim();
    const href = link.attr('href') ?? '';
    const match = href.match(/\/team\/_\/id\/(\d+)/);
    if (!name || !match) return;
    const cells = $(row).find('td[data-testid="prism-TableCell"]');
    const raw = cells.last().text().trim();
    const score = /^\d+$/.test(raw) ? Number(raw) : null;
    teams.push({ name, id: match[1], score });
  });

  if (teams.length < 2) {
    // Fallback only for extracting the two scores/names. We intentionally do not
    // infer home/away from this title; the league's game record owns that mapping.
    const title = $('meta[property="og:title"]').attr('content') ?? $('meta[name="title"]').attr('content') ?? '';
    const match = title.match(/^(.+?)\s+(\d+)\s*-\s*(\d+)\s+(.+?)\s+\(/);
    if (match) {
      teams.length = 0;
      teams.push({ name: match[1].trim(), id: '', score: Number(match[2]) });
      teams.push({ name: match[4].trim(), id: '', score: Number(match[3]) });
    }
  }
  if (teams.length < 2) throw new Error('Could not identify both teams and scores from ESPN page.');

  const status = statusFromText($('body').text());
  let winnerTeamId: string | null = null;
  if (status === 'final' && teams[0].score !== null && teams[1].score !== null && teams[0].score !== teams[1].score) {
    winnerTeamId = teams[0].score > teams[1].score ? teams[0].id || teams[0].name : teams[1].id || teams[1].name;
  }

  return { eventId, status, teams, winnerTeamId, sourceUrl };
}
