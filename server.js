import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

const API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

const liveStates = ['INPLAY_1ST_HALF', 'INPLAY_2ND_HALF', 'HT', 'INPLAY_ET', 'INPLAY_ET_2ND_HALF', 'PEN_BREAK', 'INPLAY_PENALTIES'];
const finishedStates = ['FT', 'AET', 'FT_PEN', 'CANCELLED', 'AWARDED', 'WALKOVER', 'ABANDONED'];

// Helper: extract current match minute from periods data
function getMatchMinute(fixture, stateName) {
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
function mapFixture(fixture) {
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

app.use((req, res, next) => {
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

app.use(express.static(path.join(__dirname, 'dist')));

// Main endpoint: all fixtures for today (with periods for live minute)
app.get('/api/matches', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    let allFixtures = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://api.sportmonks.com/v3/football/fixtures/date/${today}?api_token=${API_TOKEN}&include=participants;scores;periods;league.country;state&page=${page}&per_page=50`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (!data.data) {
        if (page === 1) {
          console.error('API Error:', data.message || data);
          return res.status(400).json({ error: data.message || 'API error' });
        }
        break;
      }

      allFixtures = allFixtures.concat(data.data);
      hasMore = data.pagination?.has_more || false;
      page++;
    }

    const matches = allFixtures.map(mapFixture);
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Live-only endpoint: uses livescores/inplay for real-time minute data
app.get('/api/livescores', async (req, res) => {
  try {
    const response = await fetch(
      `https://api.sportmonks.com/v3/football/livescores/inplay?api_token=${API_TOKEN}&include=participants;scores;periods;league.country;state`,
      { method: 'GET' }
    );

    const data = await response.json();

    if (!data.data) {
      return res.json([]);
    }

    const liveFixtures = Array.isArray(data.data) ? data.data : [data.data];
    const matches = liveFixtures.map(mapFixture);
    res.json(matches);
  } catch (error) {
    console.error('Error fetching livescores:', error);
    res.status(500).json({ error: 'Failed to fetch livescores' });
  }
});

app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CovaScore server running on port ${PORT}`);
});
