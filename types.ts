
export enum MatchStatus {
  UPCOMING = 'upcoming',
  LIVE = 'live',
  FINISHED = 'finished'
}

export interface Team {
  name: string;
  logo: string;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  startTime: string; // ISO string
  status: MatchStatus;
  score: {
    home: number;
    away: number;
  };
  liveMinute?: number;
  stateName?: string; // e.g. 'HT', 'INPLAY_1ST_HALF', etc.
  league: string;
  leagueId: number;
  country: string;
}

export type Theme = 'light' | 'dark';
