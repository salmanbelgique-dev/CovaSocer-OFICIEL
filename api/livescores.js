import { mapFixture } from './_utils.js';

export default async function handler(req, res) {
  try {
    const API_TOKEN = process.env.SPORTMONKS_API_TOKEN;
    if (!API_TOKEN) {
      return res.status(500).json({ error: 'SPORTMONKS_API_TOKEN environment variable is not set' });
    }

    const response = await fetch(
      `https://api.sportmonks.com/v3/football/livescores/inplay?api_token=${API_TOKEN}&include=participants;scores;periods;league.country;state`,
      { method: 'GET' }
    );

    const data = await response.json();

    if (!data.data) {
      return res.status(200).json([]);
    }

    const liveFixtures = Array.isArray(data.data) ? data.data : [data.data];
    const matches = liveFixtures.map(mapFixture);
    
    // Low cache for live scores
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate');
    res.status(200).json(matches);
  } catch (error) {
    console.error('Error fetching livescores:', error);
    res.status(500).json({ error: 'Failed to fetch livescores' });
  }
}
