export type GameResult = { winner: 'home' | 'away' | null; homeSpread: number; awaySpread: number };

/**
 * League rule:
 * - Correct favorite = 1 point.
 * - Correct underdog = 1 + 0.2 * absolute underdog spread.
 * - Incorrect = 0.
 * The spread supplied here must be the locked spread from the league database.
 */
export function scorePick(selected: 'home' | 'away', result: GameResult): number {
  if (!result.winner || selected !== result.winner) return 0;
  const selectedSpread = selected === 'home' ? result.homeSpread : result.awaySpread;
  const underdog = selectedSpread > 0;
  return underdog ? 1 + 0.2 * Math.abs(selectedSpread) : 1;
}

export function roundPoints(n: number): number { return Math.round(n * 100) / 100; }
