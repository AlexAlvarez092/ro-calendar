export interface RawLaligaTeam {
  id?: number;
  name?: string;
  shortname?: string;
  nickname?: string;
}

export interface RawLaligaVenue {
  name?: string;
}

export interface RawLaligaSubscription {
  id?: number;
  slug?: string;
  name?: string;
}

export interface RawLaligaMatch {
  id?: number;
  date?: string;
  time?: string;
  status?: string;
  name?: string;
  home_team?: RawLaligaTeam;
  away_team?: RawLaligaTeam;
  venue?: RawLaligaVenue;
  subscription?: RawLaligaSubscription;
}

export interface RawLaligaMatchesResponse {
  matches?: RawLaligaMatch[];
}
