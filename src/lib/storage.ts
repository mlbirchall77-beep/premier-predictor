import { 
  ActualOutcomes, 
  AdminSettings, 
  AppUserAccount,
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
import { supabaseService } from './supabaseService';
import { isSupabaseConfigured } from './supabaseClient';

const KEYS = {
  SUBMISSIONS: 'premier_predictor_submissions_2026',
  CATEGORIES: 'premier_predictor_categories_2026',
  ACTUALS: 'premier_predictor_actuals_2026',
  LEAGUES: 'premier_predictor_leagues_2026',
  SETTINGS: 'premier_predictor_settings_2026',
  METRICS: 'premier_predictor_metrics_2026',
  LIVE_STANDINGS: 'premier_predictor_live_standings_2026',
  CURRENT_USER: 'premier_predictor_current_user_2026',
  DEMO_CLEARED: 'premier_predictor_demo_data_cleared_2026',
  USER_ACCOUNTS: 'premier_predictor_registered_users_2026',
};

const GLOBAL_LEAGUE_DEFAULT: League = {
  id: 'global',
  name: 'Premier League Global 2026/27',
  code: 'PL2627',
  adminId: 'admin_1',
  adminName: 'Premier Predictor Admin',
  isPublic: true,
  description: 'The global league for all Premier League 2026/27 predictors worldwide.',
  createdAt: '2026-08-01T00:00:00Z',
  memberCount: 1,
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
  // Demo State
  isDemoCleared(): boolean {
    return safeGet<boolean>(KEYS.DEMO_CLEARED, false) || isSupabaseConfigured;
  },

  setDemoCleared(cleared: boolean): void {
    safeSet(KEYS.DEMO_CLEARED, cleared);
  },

  // Current User
  getCurrentUser(): CurrentUser | null {
    return safeGet<CurrentUser | null>(KEYS.CURRENT_USER, null);
  },

  setCurrentUser(user: CurrentUser | null): void {
    if (user === null) {
      try {
        localStorage.removeItem(KEYS.CURRENT_USER);
      } catch (e) {
        console.error('Error removing user session:', e);
      }
    } else {
      safeSet(KEYS.CURRENT_USER, user);
    }
  },

  // Submissions
  getSubmissions(): UserPredictionSubmission[] {
    const isCleared = this.isDemoCleared();
    const fallback = isCleared ? [] : INITIAL_SUBMISSIONS;
    return safeGet<UserPredictionSubmission[]>(KEYS.SUBMISSIONS, fallback);
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
    const updatedSub = {
      ...submission,
      id: submission.id || `sub_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };

    if (index !== -1) {
      subs[index] = updatedSub;
    } else {
      subs.push({ ...updatedSub, createdAt: new Date().toISOString() });
    }
    this.saveSubmissions(subs);
    this.incrementMetric('totalSubmissions');

    // Async push to Supabase
    if (supabaseService.isConfigured()) {
      const currentUser = this.getCurrentUser();
      supabaseService.savePrediction(updatedSub, currentUser).catch(err => {
        console.warn('Background Supabase prediction sync:', err);
      });
    }
  },

  deleteSubmission(submissionId: string): void {
    const subs = this.getSubmissions().filter(s => s.id !== submissionId);
    this.saveSubmissions(subs);
    if (supabaseService.isConfigured()) {
      supabaseService.deletePrediction(submissionId).catch(err => {
        console.warn('Background Supabase prediction delete:', err);
      });
    }
  },

  deleteUserAndData(userId: string): void {
    // 1. Remove prediction submission
    const subs = this.getSubmissions().filter(s => s.userId !== userId && s.id !== userId);
    this.saveSubmissions(subs);
    // 2. Remove user from any leagues
    const leagues = this.getLeagues();
    leagues.forEach(l => {
      // If user was admin of private mini league, could delete or leave
    });
    this.saveLeagues(leagues);

    // 3. Remove from registered user accounts
    const accounts = this.getUserAccounts().filter(a => a.id !== userId && a.email !== userId);
    this.saveUserAccounts(accounts);

    if (supabaseService.isConfigured()) {
      supabaseService.deleteUser(userId).catch(err => {
        console.warn('Background Supabase user delete:', err);
      });
    }
  },

  // Registered User Accounts (with password and email)
  getUserAccounts(): AppUserAccount[] {
    const isCleared = this.isDemoCleared();
    const fallback: AppUserAccount[] = isCleared
      ? [
          {
            id: 'admin_1',
            name: 'Mark Birchall',
            email: 'mlbirchall@yahoo.co.uk',
            teamName: 'The Invincible Pundits',
            password: 'admin',
            isAdmin: true,
            createdAt: '2026-08-01T00:00:00Z',
            isRegisteredByAdmin: true,
          },
        ]
      : [
          {
            id: 'admin_1',
            name: 'Mark Birchall',
            email: 'mlbirchall@yahoo.co.uk',
            teamName: 'The Invincible Pundits',
            password: 'admin',
            isAdmin: true,
            createdAt: '2026-08-01T00:00:00Z',
            isRegisteredByAdmin: true,
          },
          {
            id: 'user_2',
            name: 'Liam Henderson',
            email: 'liam.h@example.com',
            teamName: 'Slot Machine Reds',
            password: 'password123',
            isAdmin: false,
            createdAt: '2026-08-10T10:00:00Z',
            isRegisteredByAdmin: true,
          },
          {
            id: 'user_3',
            name: 'Emma Watson-Smith',
            email: 'emma.ws@example.com',
            teamName: "Arteta's Geometry",
            password: 'password123',
            isAdmin: false,
            createdAt: '2026-08-11T14:30:00Z',
            isRegisteredByAdmin: true,
          },
        ];
    return safeGet<AppUserAccount[]>(KEYS.USER_ACCOUNTS, fallback);
  },

  saveUserAccounts(accounts: AppUserAccount[]): void {
    safeSet(KEYS.USER_ACCOUNTS, accounts);
  },

  addOrUpdateUserAccount(account: AppUserAccount): void {
    const accounts = this.getUserAccounts();
    const existingIndex = accounts.findIndex(
      a => a.id === account.id || a.email.toLowerCase() === account.email.toLowerCase()
    );
    if (existingIndex !== -1) {
      accounts[existingIndex] = {
        ...accounts[existingIndex],
        ...account,
      };
    } else {
      accounts.push({
        ...account,
        id: account.id || `user_${Date.now()}`,
        createdAt: account.createdAt || new Date().toISOString(),
      });
    }
    this.saveUserAccounts(accounts);
    this.incrementMetric('uniquePredictors');
  },

  deleteUserAccount(accountId: string): void {
    const accounts = this.getUserAccounts().filter(a => a.id !== accountId && a.email !== accountId);
    this.saveUserAccounts(accounts);
    this.deleteUserAndData(accountId);
  },

  deleteLeague(leagueId: string): void {
    // Cannot delete global league
    if (leagueId === 'global' || leagueId === '00000000-0000-0000-0000-000000000001') {
      return;
    }
    const leagues = this.getLeagues().filter(l => l.id !== leagueId);
    this.saveLeagues(leagues);

    // Remove this leagueId from any user submissions
    const subs = this.getSubmissions();
    let subsChanged = false;
    subs.forEach(s => {
      if (s.leagueIds.includes(leagueId)) {
        s.leagueIds = s.leagueIds.filter(id => id !== leagueId);
        subsChanged = true;
      }
    });
    if (subsChanged) {
      this.saveSubmissions(subs);
    }

    // Async delete in Supabase
    if (supabaseService.isConfigured()) {
      supabaseService.deleteLeague(leagueId).catch(err => {
        console.warn('Background Supabase league delete:', err);
      });
    }
  },

  // Categories
  getCategories(): PredictionCategory[] {
    return safeGet<PredictionCategory[]>(KEYS.CATEGORIES, DEFAULT_PREDICTION_CATEGORIES);
  },

  saveCategories(categories: PredictionCategory[]): void {
    safeSet(KEYS.CATEGORIES, categories);
    if (supabaseService.isConfigured()) {
      supabaseService.saveCategories(categories).catch(err => {
        console.warn('Background Supabase categories sync:', err);
      });
    }
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
    const updated = { ...outcomes, updatedAt: new Date().toISOString() };
    safeSet(KEYS.ACTUALS, updated);
    if (supabaseService.isConfigured()) {
      supabaseService.saveActualOutcomes(updated).catch(err => {
        console.warn('Background Supabase actual outcomes sync:', err);
      });
    }
  },

  // Leagues
  getLeagues(): League[] {
    const isCleared = this.isDemoCleared();
    const fallback = isCleared ? [GLOBAL_LEAGUE_DEFAULT] : INITIAL_LEAGUES;
    return safeGet<League[]>(KEYS.LEAGUES, fallback);
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

    // Async push to Supabase
    if (supabaseService.isConfigured()) {
      const user = this.getCurrentUser();
      supabaseService.createLeague(newLeague, user.email).catch(err => {
        console.warn('Background Supabase league creation sync:', err);
      });
    }

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

    // Async push to Supabase
    if (supabaseService.isConfigured()) {
      const user = this.getCurrentUser();
      supabaseService.joinLeague(league.id, user.email).catch(err => {
        console.warn('Background Supabase league join sync:', err);
      });
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
    const isCleared = this.isDemoCleared();
    const cleanMetrics: SiteMetrics = {
      totalHits: 1,
      pageViews: 1,
      uniquePredictors: 1,
      totalSubmissions: 0,
      totalMiniLeagues: 1,
      lastUpdated: new Date().toISOString(),
      popularChampions: {},
      popularRelegated: {},
      popularGoldenBoot: {},
      popularFirstSacked: {},
    };
    return safeGet<SiteMetrics>(KEYS.METRICS, isCleared ? cleanMetrics : INITIAL_SITE_METRICS);
  },

  incrementMetric(metric: 'totalHits' | 'pageViews' | 'uniquePredictors' | 'totalSubmissions' | 'totalMiniLeagues'): void {
    const metrics = this.getMetrics();
    metrics[metric] = (metrics[metric] || 0) + 1;
    metrics.lastUpdated = new Date().toISOString();
    safeSet(KEYS.METRICS, metrics);
  },

  /**
   * Complete Demo Data Purge & Start Clean Production Database
   */
  async clearDemoData(currentUser: CurrentUser): Promise<void> {
    this.setDemoCleared(true);

    // Keep only the current user's submission if they already made one, or clean empty array
    const currentSub = this.getUserSubmission(currentUser.id);
    const cleanSubs = currentSub ? [currentSub] : [];
    this.saveSubmissions(cleanSubs);

    // Reset leagues to only the global league
    this.saveLeagues([GLOBAL_LEAGUE_DEFAULT]);

    // Reset metrics
    const cleanMetrics: SiteMetrics = {
      totalHits: 1,
      pageViews: 1,
      uniquePredictors: cleanSubs.length || 1,
      totalSubmissions: cleanSubs.length,
      totalMiniLeagues: 1,
      lastUpdated: new Date().toISOString(),
      popularChampions: {},
      popularRelegated: {},
      popularGoldenBoot: {},
      popularFirstSacked: {},
    };
    safeSet(KEYS.METRICS, cleanMetrics);

    // If Supabase is connected, purge demo rows from database
    if (supabaseService.isConfigured()) {
      await supabaseService.purgeDemoDataFromSupabase(currentUser.email);
    }
  },

  /**
   * Re-seed Demo Data for Testing
   */
  seedDemoData(): void {
    this.setDemoCleared(false);
    safeSet(KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    safeSet(KEYS.CATEGORIES, DEFAULT_PREDICTION_CATEGORIES);
    safeSet(KEYS.ACTUALS, INITIAL_ACTUAL_OUTCOMES);
    safeSet(KEYS.LEAGUES, INITIAL_LEAGUES);
    safeSet(KEYS.SETTINGS, INITIAL_ADMIN_SETTINGS);
    safeSet(KEYS.METRICS, INITIAL_SITE_METRICS);
    safeSet(KEYS.LIVE_STANDINGS, INITIAL_LIVE_STANDINGS);
  }
};
