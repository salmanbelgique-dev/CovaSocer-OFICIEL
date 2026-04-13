import { mapFixture } from './_utils.js';

export default async function handler(req, res) {
  try {
    const API_TOKEN = process.env.SPORTMONKS_API_TOKEN;
    if (!API_TOKEN) {
      return res.status(500).json({ error: 'SPORTMONKS_API_TOKEN environment variable is not set' });
    }

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
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
}
