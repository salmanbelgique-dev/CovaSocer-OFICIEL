import { Match, MatchStatus } from '../types';

const API_URL = '/api/matches';
const LIVESCORES_URL = '/api/livescores';

function mapMatch(match: any): Match {
  return {
    ...match,
    status: match.status === 'LIVE' ? MatchStatus.LIVE :
            match.status === 'FINISHED' ? MatchStatus.FINISHED :
            MatchStatus.UPCOMING,
    liveMinute: match.minute ?? undefined,
    stateName: match.stateName || undefined
  };
}

export async function fetchLiveMatches(): Promise<Match[]> {
  try {
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error('Failed to fetch matches');
    }
    
    const data = await response.json();
    return data.map(mapMatch);
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return [];
  }
}

// Fetch only live/inplay matches with real-time minute data
export async function fetchLivescores(): Promise<Match[]> {
  try {
    const response = await fetch(LIVESCORES_URL);
    
    if (!response.ok) {
      throw new Error('Failed to fetch livescores');
    }
    
    const data = await response.json();
    return data.map(mapMatch);
  } catch (error) {
    console.error('Error fetching livescores:', error);
    return [];
  }
}

export const mockMatches: Match[] = [];

