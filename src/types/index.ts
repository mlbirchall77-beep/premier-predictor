export interface Team {
  id: string;
  name: string;
  shortName: string;
  code: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  stadium: string;
  manager: string;
  iconName?: string;
  isPromoted?: boolean;
}

export interface PredictionCategory {
  id: string;
  title: string;
  description: string;
  type: 'manager' | 'player' | 'team' | 'text' | 'custom';
  options?: string[]; // predefined suggestions or choices
  isDefault: boolean;
  pointsValue: number; // default 3
  resolvedWinner?: string;
  isResolved?: boolean;
}

export interface UserPredictionSubmission {
  id: string;
  userId: string;
  userName: string;
  teamName: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  isLocked: boolean;
  adminOverride?: boolean;
  tablePrediction: string[]; // Array of 20 team IDs in order (index 0 = 1st, index 19 = 20th)
  bespokePredictions: Record<string, string>; // categoryId -> selected answer/name
  leagueIds: string[]; // List of league IDs this user belongs to
}

export interface League {
  id: string;
  name: string;
  code: string;
  adminId: string;
  adminName: string;
  isPublic: boolean;
  description?: string;
  createdAt: string;
  memberCount: number;
}

export interface ActualOutcomes {
  tableStandings: string[]; // 20 team IDs in order (1st to 20th)
  bespokeResults: Record<string, string>; // categoryId -> actual winning answer
  updatedAt: string;
}

export interface ScoreItem {
  type: 'table' | 'bespoke';
  label: string;
  predicted: string;
  actual: string;
  points: number;
  reason: 'exact' | 'one_off' | 'miss';
}

export interface UserScoreBreakdown {
  submissionId: string;
  userId: string;
  userName: string;
  teamName: string;
  totalPoints: number;
  tablePoints: number;
  bespokePoints: number;
  exactTableCount: number;
  oneOffTableCount: number;
  exactBespokeCount: number;
  rank: number;
  items: ScoreItem[];
}

export interface LivePlStanding {
  position: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[]; // e.g. ['W', 'W', 'D', 'L', 'W']
}

export interface SiteMetrics {
  totalHits: number;
  pageViews: number;
  uniquePredictors: number;
  totalSubmissions: number;
  totalMiniLeagues: number;
  lastUpdated: string;
  popularChampions: Record<string, number>;
  popularRelegated: Record<string, number>;
  popularGoldenBoot: Record<string, number>;
  popularFirstSacked: Record<string, number>;
}

export interface AdminSettings {
  isPredictionsLocked: boolean;
  lockDate: string;
  seasonName: string;
  allowUserOverrides: boolean;
  autoSyncLiveApi: boolean;
  apiProvider: 'football-data' | 'mock-simulator' | 'custom-json';
  apiKey: string;
  adminPassword?: string;
  adminEmail?: string;
  onlyAdminCanManageLeagues?: boolean;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  teamName: string;
  isAdmin: boolean;
  isAdminAuthenticated?: boolean;
}

export interface AppUserAccount {
  id: string;
  name: string;
  email: string;
  teamName: string;
  password?: string;
  isAdmin?: boolean;
  createdAt: string;
  isRegisteredByAdmin?: boolean;
}

