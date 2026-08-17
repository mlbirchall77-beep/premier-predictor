import { 
  ActualOutcomes, 
  AdminSettings, 
  CurrentUser, 
  League, 
  LivePlStanding, 
  PredictionCategory, 
  SiteMetrics, 
  UserPredictionSubmission 
} from '../types';
import { DEFAULT_PREDICTION_CATEGORIES } from '../data/defaultCategories';
import { 
  INITIAL_ACTUAL_OUTCOMES, 
  INITIAL_ADMIN_SETTINGS, 
  INITIAL_LEAGUES, 
  INITIAL_LIVE_STANDINGS, 
  INITIAL_SITE_METRICS, 
  INITIAL_SUBMISSIONS 
} from '../data/mockData';
import { PREMIER_LEAGUE_TEAMS_2026_27 } from '../data/teams2026';

const KEYS = {
  SUBMISSIONS: 'premier_predictor_submissions_2026',
  CATEGORIES: 'premier_predictor_categories_2026',
  ACTUALS: 'premier_predictor_actuals_2026',
  LEAGUES: 'premier_predictor_leagues_2026',
  SETTINGS: 'premier_predictor_settings_2026',
  METRICS: 'premier_predictor_metrics_2026',
  LIVE_STANDINGS: 'premier_predictor_live_standings_2026',
  CURRENT_USER: 'premier_predictor_current_user_2026',
};

// Safe LocalStorage helpers
function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

export const storage = {
  // Current User
  getCurrentUser(): CurrentUser {
    return safeGet<CurrentUser>(KEYS.CURRENT_USER, {
      id: 'user_1',
      name: 'Josh Birchall',
      email: 'joshbirchall9@gmail.com',
      teamName: 'The Invincible Pundits',
      isAdmin: true,
    });
  },

  setCurrentUser(user: CurrentUser): void {
    safeSet(KEYS.CURRENT_USER, user);
  },

  // Submissions
  getSubmissions(): UserPredictionSubmission[] {
    return safeGet<UserPredictionSubmission[]>(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
  },

  saveSubmissions(submissions: UserPredictionSubmission[]): void {
    safeSet(KEYS.SUBMISSIONS, submissions);
  },

  getUserSubmission(userId: string): UserPredictionSubmission | undefined {
    const subs = this.getSubmissions();
    return subs.find(s => s.userId === userId);
  },

  saveUserSubmission(submission: UserPredictionSubmission): void {
    const subs = this.getSubmissions();
    const index = subs.findIndex(s => s.userId === submission.userId || s.id === submission.id);
    if (index !== -1) {
      subs[index] = { ...submission, updatedAt: new Date().toISOString() };
    } else {
      subs.push({ ...submission, id: submission.id || `sub_${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.saveSubmissions(subs);
    this.incrementMetric('totalSubmissions');
  },

  // Categories
  getCategories(): PredictionCategory[] {
    return safeGet<PredictionCategory[]>(KEYS.CATEGORIES, DEFAULT_PREDICTION_CATEGORIES);
  },

  saveCategories(categories: PredictionCategory[]): void {
    safeSet(KEYS.CATEGORIES, categories);
  },

  addCategory(category: PredictionCategory): void {
    const cats = this.getCategories();
    cats.push(category);
    this.saveCategories(cats);
  },

  updateCategory(category: PredictionCategory): void {
    const cats = this.getCategories();
    const index = cats.findIndex(c => c.id === category.id);
    if (index !== -1) {
      cats[index] = category;
      this.saveCategories(cats);
    }
  },

  deleteCategory(categoryId: string): void {
    const cats = this.getCategories().filter(c => c.id !== categoryId);
    this.saveCategories(cats);
  },

  // Actual Outcomes
  getActualOutcomes(): ActualOutcomes {
    return safeGet<ActualOutcomes>(KEYS.ACTUALS, INITIAL_ACTUAL_OUTCOMES);
  },

  saveActualOutcomes(outcomes: ActualOutcomes): void {
    safeSet(KEYS.ACTUALS, { ...outcomes, updatedAt: new Date().toISOString() });
  },

  // Leagues
  getLeagues(): League[] {
    return safeGet<League[]>(KEYS.LEAGUES, INITIAL_LEAGUES);
  },

  saveLeagues(leagues: League[]): void {
    safeSet(KEYS.LEAGUES, leagues);
  },

  createLeague(name: string, description: string, adminId: string, adminName: string): League {
    const leagues = this.getLeagues();
    const newLeague: League = {
      id: `league_${Date.now()}`,
      name,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      adminId,
      adminName,
      isPublic: false,
      description,
      createdAt: new Date().toISOString(),
      memberCount: 1,
    };
    leagues.push(newLeague);
    this.saveLeagues(leagues);
    this.incrementMetric('totalMiniLeagues');
    return newLeague;
  },

  joinLeagueByCode(code: string, userId: string): { success: boolean; message: string; league?: League } {
    const leagues = this.getLeagues();
    const league = leagues.find(l => l.code.toUpperCase() === code.trim().toUpperCase());
    if (!league) {
      return { success: false, message: 'League code not found. Please verify the code.' };
    }
    
    // Add to user submission
    const subs = this.getSubmissions();
    const userSub = subs.find(s => s.userId === userId);
    if (userSub) {
      if (!userSub.leagueIds.includes(league.id)) {
        userSub.leagueIds.push(league.id);
        this.saveSubmissions(subs);
        league.memberCount = (league.memberCount || 1) + 1;
        this.saveLeagues(leagues);
      }
    }
    return { success: true, message: `Successfully joined ${league.name}!`, league };
  },

  // Admin Settings
  getAdminSettings(): AdminSettings {
    return safeGet<AdminSettings>(KEYS.SETTINGS, INITIAL_ADMIN_SETTINGS);
  },

  saveAdminSettings(settings: AdminSettings): void {
    safeSet(KEYS.SETTINGS, settings);
  },

  // Live Standings
  getLiveStandings(): LivePlStanding[] {
    return safeGet<LivePlStanding[]>(KEYS.LIVE_STANDINGS, INITIAL_LIVE_STANDINGS);
  },

  saveLiveStandings(standings: LivePlStanding[]): void {
    safeSet(KEYS.LIVE_STANDINGS, standings);
    // Also sync table standings in actual outcomes
    const actuals = this.getActualOutcomes();
    actuals.tableStandings = standings.map(s => s.teamId);
    this.saveActualOutcomes(actuals);
  },

  // Site Metrics
  getMetrics(): SiteMetrics {
    return safeGet<SiteMetrics>(KEYS.METRICS, INITIAL_SITE_METRICS);
  },

  incrementMetric(metric: 'totalHits' | 'pageViews' | 'uniquePredictors' | 'totalSubmissions' | 'totalMiniLeagues'): void {
    const metrics = this.getMetrics();
    metrics[metric] = (metrics[metric] || 0) + 1;
    metrics.lastUpdated = new Date().toISOString();
    safeSet(KEYS.METRICS, metrics);
  },

  // Reset to default
  resetToDefaults(): void {
    safeSet(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    safeSet(KEYS.CATEGORIES, DEFAULT_PREDICTION_CATEGORIES);
    safeSet(KEYS.ACTUALS, INITIAL_ACTUAL_OUTCOMES);
    safeSet(KEYS.LEAGUES, INITIAL_LEAGUES);
    safeSet(KEYS.SETTINGS, INITIAL_ADMIN_SETTINGS);
    safeSet(KEYS.METRICS, INITIAL_SITE_METRICS);
    safeSet(KEYS.LIVE_STANDINGS, INITIAL_LIVE_STANDINGS);
  }
};
