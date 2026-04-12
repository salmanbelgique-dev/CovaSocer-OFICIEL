import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function footballApiPlugin() {
  return {
    name: 'football-api',
    configureServer(server: any) {
      server.middlewares.use('/api/matches', async (req: any, res: any) => {
        try {
          const API_TOKEN = process.env.SPORTMONKS_API_TOKEN;
          const today = new Date().toISOString().split('T')[0];

          let allFixtures: any[] = [];
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const response = await fetch(
              `https://api.sportmonks.com/v3/football/fixtures/date/${today}?api_token=${API_TOKEN}&include=participants;scores;league.country;state&page=${page}&per_page=50`,
              { method: 'GET' }
            );

            const data = await response.json();

            if (!data.data) {
              if (page === 1) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: data.message || 'API error' }));
                return;
              }
              break;
            }

            allFixtures = allFixtures.concat(data.data);
            hasMore = data.pagination?.has_more || false;
            page++;
          }

          const liveStates = ['INPLAY_1ST_HALF', 'INPLAY_2ND_HALF', 'HT', 'INPLAY_ET', 'INPLAY_ET_2ND_HALF', 'PEN_BREAK', 'INPLAY_PENALTIES'];
          const finishedStates = ['FT', 'AET', 'FT_PEN', 'CANCELLED', 'AWARDED', 'WALKOVER', 'ABANDONED'];

          const matches = allFixtures.map((fixture: any) => {
            const homeTeam = fixture.participants?.find((p: any) => p.meta?.location === 'home');
            const awayTeam = fixture.participants?.find((p: any) => p.meta?.location === 'away');
            const homeScore = fixture.scores?.find((s: any) => s.description === 'CURRENT' && s.score?.participant === 'home');
            const awayScore = fixture.scores?.find((s: any) => s.description === 'CURRENT' && s.score?.participant === 'away');
            const stateName = fixture.state?.developer_name || '';

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
              startTime: fixture.starting_at,
              status: liveStates.includes(stateName) ? 'LIVE' :
                      finishedStates.includes(stateName) ? 'FINISHED' : 'UPCOMING',
              score: {
                home: homeScore?.score?.goals ?? 0,
                away: awayScore?.score?.goals ?? 0
              },
              minute: null
            };
          });

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(matches));
        } catch (error) {
          console.error('Error fetching matches:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to fetch matches' }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    if (env.SPORTMONKS_API_TOKEN) {
      process.env.SPORTMONKS_API_TOKEN = env.SPORTMONKS_API_TOKEN;
    }
    return {
      server: {
        port: 5000,
        host: '0.0.0.0',
        allowedHosts: true,
      },
      plugins: [react(), footballApiPlugin()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
