
export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  time: string;
}

export interface MatchStats {
  avgGoals: string;
  recentForm: string;
  h2h: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Prediction {
  match: Match;
  bet: string;
  odds: number;
  confidence: number;
  reasoning: string;
  marketType: 'Combo' | 'Corners' | 'Cards' | 'Classic' | 'Goal/NoGoal';
  statistics: MatchStats;
}

export interface Schedina {
  predictions: Prediction[];
  totalOdds: number;
  potentialWinnings: number;
  sources?: GroundingSource[];
}

export type BetStatus = 'Pending' | 'Won' | 'Lost';

export interface PlayedSchedina extends Schedina {
  id: string;
  date: string;
  stake: number;
  status: BetStatus;
}
