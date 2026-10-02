import {requireUser} from '@/lib/auth';

export default async function Rules(){
  await requireUser();
  return <main className="container">
    <h1>League Rules</h1>
    <div className="card">
      <h2>Weekly Picks</h2>
      <p>Pick the winner of all 15 selected games. A correct favorite is worth 1 point. A correct underdog is worth 1 point plus 0.2 times the locked point spread.</p>

      <h2>Locked Lines</h2>
      <p>The point value shown when the commissioner publishes the game is the value used for scoring, even if the betting line later changes.</p>

      <h2>Three Competitions</h2>
      <p>The league has three separate competitions: Survivor, Total Score, and the weekly competition for eliminated players.</p>

      <h3>Survivor Champion</h3>
      <p>After Week 7, the field is cut in half based on YTD score. In Weeks 8–11, two players are eliminated each week based on weekly score, with YTD score as the tiebreaker. In Weeks 12–13, one player is eliminated each week. Four players advance to the finals. The four finalists make picks on the conference championship games and Army–Navy to determine the Survivor Champion.</p>

      <h3>Total Score Champion</h3>
      <p>All players continue accumulating points toward the season-long total score, even after being eliminated from Survivor. The player with the highest season-long point total is the Total Score Champion.</p>

      <h3>Weekly Winner for Eliminated Players</h3>
      <p>Beginning in Week 8, players who have been eliminated from Survivor continue submitting all 15 weekly picks and compete for the weekly prize based on that week's score. Eliminated players remain eligible for this weekly competition through Week 14.</p>

      <h2>Eliminated Players</h2>
      <p>Elimination applies only to the Survivor competition. It does not remove a player from the league. Eliminated players continue making all 15 weekly picks, accumulating points toward the Total Score Championship, and competing for the eliminated-player weekly prize in Weeks 8–14.</p>
    </div>
  </main>;
}
