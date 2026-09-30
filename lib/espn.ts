import * as cheerio from 'cheerio';

export type ESPNTeamResult = { name: string; id: string; score: number | null };
export type ESPNGame = {
  eventId: string;
  status: 'scheduled' | 'in_progress' | 'final' | 'unknown';
  teams: ESPNTeamResult[];
  winnerTeamId: string | null;
  sourceUrl: string;
};

export type ESPNScheduleGame = {
  eventId: string;
  awayTeam: string;
  awayTeamId: string;
  homeTeam: string;
  homeTeamId: string;
  favoriteTeam: string | null;
  favoriteTeamId: string | null;
  underdogTeam: string | null;
  underdogTeamId: string | null;
  spread: number | null;
  favoritePoints: number;
  underdogPoints: number | null;
  lineText: string | null;
  day: string | null;
  time: string | null;
  network: string | null;
  kickoffAt: string | null;
  sourceUrl: string;
};

function statusFromText(text: string): ESPNGame['status'] {
  const t = text.toLowerCase();
  if (/\bfinal\b/.test(t)) return 'final';
  if (t.includes('in progress') || t.includes('live') || /\bq[1-4]\b/.test(t) || t.includes('quarter')) return 'in_progress';
  if (t.includes('scheduled') || t.includes('upcoming')) return 'scheduled';
  return 'unknown';
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function teamIdFromHref(href: string) {
  return href.match(/\/college-football\/team\/_\/id\/(\d+)/)?.[1] ?? '';
}

function eventIdFromHref(href: string) {
  return href.match(/\/game\/_\/gameId\/(\d+)/)?.[1] ?? '';
}

export function espnScheduleUrl(year: number, week: number, seasonType = 2) {
  return `https://www.espn.com/college-football/schedule/_/week/${week}/year/${year}/seasontype/${seasonType}`;
}

export async function fetchESPNSchedule(year: number, week: number, seasonType = 2): Promise<ESPNScheduleGame[]> {
  const sourceUrl = espnScheduleUrl(year, week, seasonType);
  const response = await fetch(sourceUrl, {
    cache: 'no-store',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CollegeFootballPicks/1.0)',
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!response.ok) throw new Error(`ESPN returned ${response.status}`);

  const html = await response.text();
  const $ = cheerio.load(html);
  const games: ESPNScheduleGame[] = [];

  $('table tbody tr').each((_, row) => {
    const $row = $(row);
    const teamLinks = $row.find('a[href*="/college-football/team/_/id/"]').toArray();
    const uniqueTeams: { name: string; id: string }[] = [];

    for (const element of teamLinks) {
      const link = $(element);
      const name = link.text().trim();
      const id = teamIdFromHref(link.attr('href') ?? '');
      if (name && id && !uniqueTeams.some(t => t.id === id)) uniqueTeams.push({ name, id });
    }
    if (uniqueTeams.length < 2) return;

    const away = uniqueTeams[0];
    const home = uniqueTeams[1];
    const gameHref = $row.find('a[href*="/college-football/game/_/gameId/"]').first().attr('href') ?? '';
    const eventId = eventIdFromHref(gameHref);
    if (!eventId) return;

    const cells = $row.find('td').toArray().map(el => $(el).text().trim());
    const scheduleSection = $row.closest('.ScheduleTables, section, .ResponsiveTable');
    const day = scheduleSection.find('h2, .Table__Title, .ScheduleTables__Title').first().text().trim() || null;
    const time = $row.find('td[data-testid*="date" i], td[class*="date" i], a[href*="gameId"]').filter((_, el) => /\\d{1,2}:\\d{2}/.test($(el).text())).first().text().trim()
      || cells.find(value => /\\b\\d{1,2}:\\d{2}\\s*(AM|PM)\\b/i.test(value)) || null;
    const network = $row.find('td[data-testid*="broadcast" i], td[class*="broadcast" i], [class*="network" i]').first().text().trim()
      || cells.find(value => /^(ABC|CBS|FOX|NBC|ESPN(?:2|U|NEWS)?|FS1|FS2|BTN|SEC Network|ACC Network|The CW|Peacock|Paramount\\+|ESPN\\+)$/i.test(value)) || null;
    let kickoffAt: string | null = null;
    if (day && time) {
      const parsed = new Date(`${day} ${time}`);
      if (!Number.isNaN(parsed.getTime())) kickoffAt = parsed.toISOString();
    }

    const odds = $row.find('[data-testid="OddsFragmentLine"]').first();
    const lineText = odds.text().trim() || null;
    const detail = odds.attr('data-track-event_detail') ?? '';
    const rawLine = lineText ?? detail.split(':').pop() ?? '';
    const lineMatch = rawLine.match(/(?:Line:\s*)?(.+?)\s+([+-]?\d+(?:\.\d+)?)\s*$/i);

    let favoriteTeam: string | null = null;
    let favoriteTeamId: string | null = null;
    let underdogTeam: string | null = null;
    let underdogTeamId: string | null = null;
    let spread: number | null = null;
    let underdogPoints: number | null = null;

    if (lineMatch) {
      const favoriteToken = normalizeName(lineMatch[1]);
      const signed = Number(lineMatch[2]);
      if (Number.isFinite(signed) && signed < 0) {
        spread = Math.abs(signed);
        const favorite =
          uniqueTeams.find(t => normalizeName(t.name) === favoriteToken) ??
          uniqueTeams.find(t => normalizeName(t.name).includes(favoriteToken) || favoriteToken.includes(normalizeName(t.name)));
        if (favorite) {
          const underdog = favorite.id === away.id ? home : away;
          favoriteTeam = favorite.name;
          favoriteTeamId = favorite.id;
          underdogTeam = underdog.name;
          underdogTeamId = underdog.id;
          underdogPoints = 1 + 0.2 * spread;
        }
      }
    }

    games.push({
      eventId,
      awayTeam: away.name,
      awayTeamId: away.id,
      homeTeam: home.name,
      homeTeamId: home.id,
      favoriteTeam,
      favoriteTeamId,
      underdogTeam,
      underdogTeamId,
      spread,
      favoritePoints: 1,
      underdogPoints: underdogPoints === null ? null : Math.round(underdogPoints * 10) / 10,
      lineText,
      day,
      time,
      network,
      kickoffAt,
      sourceUrl,
    });
  });

  return games;
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
