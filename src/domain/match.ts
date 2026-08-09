export interface Team {
  id: number;
  name: string;
  shortName?: string;
  nickname?: string;
}

export interface Match {
  id: number;
  competition: string;
  round: number | string;
  status: string;
  date: Date;
  hasConfirmedTime: boolean;
  homeTeam: Team;
  awayTeam: Team;
  venue: string | null;
}
