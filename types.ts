
export type SportType = 'Football' | 'Basketball' | 'Tennis' | 'Volley' | 'All';

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  time: string;
  date: string;
  sport: SportType;
  imageUrl?: string;
}

export interface MatchStats {
  avgGoals?: string;
  recentForm: string;
  h2h?: string;
  pointsPerGame?: string;
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
  marketType: string;
  statistics: MatchStats;
  event?: string; // Utilizzato nelle combo per il nome del match
}

export interface ComboTip {
  title: string;
  type: 'Safe' | 'HighRisk';
  predictions: Prediction[];
  totalOdds: number;
  reasoning: string;
}

export interface Schedina {
  predictions: Prediction[];
  dailyCombos: ComboTip[];
  totalOdds: number;
  sources?: GroundingSource[];
  lastUpdated?: string;
}

export type BetStatus = 'Pending' | 'Won' | 'Lost';

export interface PlayedSchedina extends Schedina {
  id: string;
  date: string;
  stake: number;
  status: BetStatus;
}
