export const liveStates = ['INPLAY_1ST_HALF', 'INPLAY_2ND_HALF', 'HT', 'INPLAY_ET', 'INPLAY_ET_2ND_HALF', 'PEN_BREAK', 'INPLAY_PENALTIES'];
export const finishedStates = ['FT', 'AET', 'FT_PEN', 'CANCELLED', 'AWARDED', 'WALKOVER', 'ABANDONED'];

// Helper: extract current match minute from periods data
export function getMatchMinute(fixture, stateName) {
  // If the match has periods data, find the ticking (active) period
  const periods = fixture.periods;
  if (periods && Array.isArray(periods) && periods.length > 0) {
    // Find the currently ticking period
    const tickingPeriod = periods.find(p => p.ticking === true);
    if (tickingPeriod) {
      // Add +1 because football broadcasts show the current minute (0:01-0:59 is 1')
      const currentMinute = (tickingPeriod.counts_from || 0) + (tickingPeriod.minutes || 0) + 1;
      return currentMinute;
    }
    // If no ticking period, use the last period's end
    const sortedPeriods = [...periods].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
    if (lastPeriod) {
      return (lastPeriod.counts_from || 0) + (lastPeriod.minutes || 0);
    }
  }

  // Fallback: calculate from starting_at_timestamp for live matches
  if (liveStates.includes(stateName) && stateName !== 'HT') {
    const startTimestamp = fixture.starting_at_timestamp;
    if (startTimestamp) {
      const nowSec = Math.floor(Date.now() / 1000);
      // Math.floor(diff / 60) + 1 gives the current minute
      let elapsedMin = Math.floor((nowSec - startTimestamp) / 60) + 1;
      // Cap at reasonable values based on state
      if (stateName === 'INPLAY_1ST_HALF') {
        elapsedMin = Math.min(elapsedMin, 50); // 45 + some added time
      } else if (stateName === 'INPLAY_2ND_HALF') {
        elapsedMin = Math.max(elapsedMin - 15, 46); // subtract ~15min HT, starts at 46'
        elapsedMin = Math.min(elapsedMin, 105);
      }
      return Math.max(1, elapsedMin);
    }
  }

  // For HT state, return 45
  if (stateName === 'HT') return 45;

  return null;
}

// Helper: map a fixture to our match format
export function mapFixture(fixture) {
  const homeTeam = fixture.participants?.find(p => p.meta?.location === 'home');
  const awayTeam = fixture.participants?.find(p => p.meta?.location === 'away');
  const homeScore = fixture.scores?.find(s => s.description === 'CURRENT' && s.score?.participant === 'home');
  const awayScore = fixture.scores?.find(s => s.description === 'CURRENT' && s.score?.participant === 'away');
  const stateName = fixture.state?.developer_name || '';

  const isLive = liveStates.includes(stateName);
  const isFinished = finishedStates.includes(stateName);

  return {
    id: fixture.id.toString(),
    league: (fixture.league?.name || 'UNKNOWN').toUpperCase(),
    leagueId: fixture.league_id,
    country: (fixture.league?.country?.name || '').toUpperCase(),
    homeTeam: {
      name: (homeTeam?.name || 'TBD').toUpperCase(),
      logo: homeTeam?.image_path || ''
    },
    awayTeam: {
      name: (awayTeam?.name || 'TBD').toUpperCase(),
      logo: awayTeam?.image_path || ''
    },
    startTime: new Date(fixture.starting_at_timestamp * 1000).toISOString(),
    status: isLive ? 'LIVE' : isFinished ? 'FINISHED' : 'UPCOMING',
    stateName: stateName, // e.g. 'HT', 'INPLAY_1ST_HALF', etc.
    score: {
      home: homeScore?.score?.goals ?? 0,
      away: awayScore?.score?.goals ?? 0
    },
    minute: isLive ? getMatchMinute(fixture, stateName) : null
  };
}
