import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  ActualOutcomes, 
  CurrentUser, 
  League, 
  PredictionCategory, 
  SiteMetrics, 
  UserPredictionSubmission 
} from '../types';
import { DEFAULT_PREDICTION_CATEGORIES } from '../data/defaultCategories';

export interface DatabaseTestResult {
  isConfigured: boolean;
  connected: boolean;
  message: string;
  tableStats: {
    profiles: number;
    predictions: number;
    leagues: number;
    league_members: number;
    prediction_categories: number;
    actual_outcomes: number;
    site_metrics: number;
  };
  errors?: string[];
}

export const supabaseService = {
  isConfigured(): boolean {
    return isSupabaseConfigured && supabase !== null;
  },

  /**
   * Test connectivity and table existence in Supabase
   */
  async testConnectivity(): Promise<DatabaseTestResult> {
    if (!this.isConfigured() || !supabase) {
      return {
        isConfigured: false,
        connected: false,
        message: 'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not configured or still have placeholder values.',
        tableStats: {
          profiles: 0,
          predictions: 0,
          leagues: 0,
          league_members: 0,
          prediction_categories: 0,
          actual_outcomes: 0,
          site_metrics: 0,
        },
      };
    }

    const stats = {
      profiles: 0,
      predictions: 0,
      leagues: 0,
      league_members: 0,
      prediction_categories: 0,
      actual_outcomes: 0,
      site_metrics: 0,
    };
    const errors: string[] = [];

    try {
      // 1. Profiles
      const { count: profCount, error: profErr } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (profErr) errors.push(`profiles: ${profErr.message}`);
      else stats.profiles = profCount || 0;

      // 2. Predictions
      const { count: predCount, error: predErr } = await supabase
        .from('predictions')
        .select('*', { count: 'exact', head: true });
      if (predErr) errors.push(`predictions: ${predErr.message}`);
      else stats.predictions = predCount || 0;

      // 3. Leagues
      const { count: lCount, error: lErr } = await supabase
        .from('leagues')
        .select('*', { count: 'exact', head: true });
      if (lErr) errors.push(`leagues: ${lErr.message}`);
      else stats.leagues = lCount || 0;

      // 4. League Members
      const { count: lmCount, error: lmErr } = await supabase
        .from('league_members')
        .select('*', { count: 'exact', head: true });
      if (lmErr) errors.push(`league_members: ${lmErr.message}`);
      else stats.league_members = lmCount || 0;

      // 5. Prediction Categories
      const { count: catCount, error: catErr } = await supabase
        .from('prediction_categories')
        .select('*', { count: 'exact', head: true });
      if (catErr) errors.push(`prediction_categories: ${catErr.message}`);
      else stats.prediction_categories = catCount || 0;

      // 6. Actual Outcomes
      const { count: actCount, error: actErr } = await supabase
        .from('actual_outcomes')
        .select('*', { count: 'exact', head: true });
      if (actErr) errors.push(`actual_outcomes: ${actErr.message}`);
      else stats.actual_outcomes = actCount || 0;

      // 7. Site Metrics
      const { count: metCount, error: metErr } = await supabase
        .from('site_metrics')
        .select('*', { count: 'exact', head: true });
      if (metErr) errors.push(`site_metrics: ${metErr.message}`);
      else stats.site_metrics = metCount || 0;

      const isHealthy = errors.length === 0;

      return {
        isConfigured: true,
        connected: isHealthy,
        message: isHealthy 
          ? 'Successfully connected to live Supabase PostgreSQL database! All tables detected.'
          : `Connected with warnings: ${errors.join(', ')}`,
        tableStats: stats,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (e: any) {
      return {
        isConfigured: true,
        connected: false,
        message: `Database connection failed: ${e?.message || e}`,
        tableStats: stats,
        errors: [String(e?.message || e)],
      };
    }
  },

  /**
   * Fetch complete live data from Supabase
   */
  async fetchLiveDatabase(): Promise<{
    submissions: UserPredictionSubmission[];
    categories: PredictionCategory[];
    actualOutcomes: ActualOutcomes | null;
    leagues: League[];
    metrics: SiteMetrics | null;
  } | null> {
    if (!this.isConfigured() || !supabase) return null;

    try {
      // 1. Fetch Categories
      const { data: catData } = await supabase
        .from('prediction_categories')
        .select('*')
        .order('created_at', { ascending: true });

      const categories: PredictionCategory[] = catData && catData.length > 0
        ? catData.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            type: c.category_type || 'custom',
            options: Array.isArray(c.options) ? c.options : (c.options ? JSON.parse(c.options) : undefined),
            isDefault: Boolean(c.is_default),
            pointsValue: Number(c.points_value) || 3,
          }))
        : DEFAULT_PREDICTION_CATEGORIES;

      // 2. Fetch Leagues & Member Counts
      const { data: leaguesData } = await supabase
        .from('leagues')
        .select(`
          id,
          name,
          code,
          description,
          is_public,
          created_by,
          created_at
        `);

      const { data: membersData } = await supabase
        .from('league_members')
        .select('league_id, user_id');

      const leagues: League[] = (leaguesData || []).map(l => {
        const members = (membersData || []).filter(m => m.league_id === l.id);
        return {
          id: l.id,
          name: l.name,
          code: l.code,
          adminId: l.created_by || 'admin_1',
          adminName: 'League Creator',
          isPublic: Boolean(l.is_public),
          description: l.description || '',
          createdAt: l.created_at || new Date().toISOString(),
          memberCount: members.length > 0 ? members.length : 1,
        };
      });

      // 3. Fetch Predictions & User Profiles
      const { data: predData } = await supabase
        .from('predictions')
        .select('*');

      const { data: profData } = await supabase
        .from('profiles')
        .select('*');

      const profileMap = new Map<string, any>();
      (profData || []).forEach(p => profileMap.set(p.id, p));

      const submissions: UserPredictionSubmission[] = (predData || []).map(p => {
        const profile = profileMap.get(p.user_id);
        const userLeagues = (membersData || [])
          .filter(m => m.user_id === p.user_id)
          .map(m => m.league_id);

        return {
          id: p.id,
          userId: p.user_id,
          userName: profile?.full_name || 'Predictor',
          teamName: profile?.team_name || 'My Fantasy XI',
          email: profile?.email || '',
          createdAt: p.created_at || new Date().toISOString(),
          updatedAt: p.updated_at || new Date().toISOString(),
          isLocked: Boolean(p.is_locked),
          adminOverride: Boolean(p.admin_override),
          tablePrediction: Array.isArray(p.table_prediction) 
            ? p.table_prediction 
            : (typeof p.table_prediction === 'string' ? JSON.parse(p.table_prediction) : []),
          bespokePredictions: typeof p.bespoke_predictions === 'object' && p.bespoke_predictions !== null
            ? p.bespoke_predictions
            : (typeof p.bespoke_predictions === 'string' ? JSON.parse(p.bespoke_predictions) : {}),
          leagueIds: userLeagues,
        };
      });

      // 4. Fetch Actual Outcomes
      const { data: actData } = await supabase
        .from('actual_outcomes')
        .select('*')
        .limit(1)
        .maybeSingle();

      let actualOutcomes: ActualOutcomes | null = null;
      if (actData) {
        const rawTable = Array.isArray(actData.table_standings)
          ? actData.table_standings
          : (typeof actData.table_standings === 'string' ? JSON.parse(actData.table_standings) : []);
        const rawBespoke = typeof actData.bespoke_results === 'object' && actData.bespoke_results !== null
          ? actData.bespoke_results
          : (typeof actData.bespoke_results === 'string' ? JSON.parse(actData.bespoke_results) : {});

        const isLegacy = rawBespoke && (
          rawBespoke.first_manager_sacked === 'Pierre Sage (Crystal Palace)' ||
          rawBespoke.top_goal_scorer === 'Erling Haaland (Man City)' ||
          rawBespoke.league_cup_winners === 'Chelsea'
        );

        actualOutcomes = {
          tableStandings: isLegacy ? [] : rawTable,
          bespokeResults: isLegacy ? {} : rawBespoke,
          updatedAt: actData.updated_at || new Date().toISOString(),
        };
      }

      // 5. Fetch Metrics
      const { data: metData } = await supabase
        .from('site_metrics')
        .select('*')
        .limit(1)
        .maybeSingle();

      let metrics: SiteMetrics | null = null;
      if (metData) {
        metrics = {
          totalHits: Number(metData.total_hits) || 0,
          pageViews: Number(metData.page_views) || 0,
          uniquePredictors: Number(metData.unique_visitors) || submissions.length,
          totalSubmissions: submissions.length,
          totalMiniLeagues: leagues.length,
          lastUpdated: metData.updated_at || new Date().toISOString(),
          popularChampions: {},
          popularRelegated: {},
          popularGoldenBoot: {},
          popularFirstSacked: {},
        };
      }

      return {
        submissions,
        categories,
        actualOutcomes,
        leagues,
        metrics,
      };
    } catch (err) {
      console.error('Error reading live database from Supabase:', err);
      return null;
    }
  },

  /**
   * Save / Upsert a User Prediction to Supabase
   */
  async savePrediction(sub: UserPredictionSubmission, user: CurrentUser): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured() || !supabase) {
      return { success: false, error: 'Supabase is not configured' };
    }

    try {
      const userEmail = (user.email || sub.email || '').trim().toLowerCase();
      if (!userEmail) {
        return { success: false, error: 'User email is required to sync predictions.' };
      }

      // 1. Check if profile already exists for this email
      const { data: profile, error: profFetchErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      if (profFetchErr) {
        console.warn('Profile fetch note:', profFetchErr);
      }

      let profileId: string;

      if (profile?.id) {
        profileId = profile.id;
        // Update profile
        await supabase
          .from('profiles')
          .update({
            full_name: user.name || sub.userName,
            team_name: user.teamName || sub.teamName,
            is_admin: Boolean(user.isAdmin),
            updated_at: new Date().toISOString(),
          })
          .eq('id', profileId);
      } else {
        // Insert new profile
        const { data: newProf, error: insErr } = await supabase
          .from('profiles')
          .insert({
            email: userEmail,
            full_name: user.name || sub.userName,
            team_name: user.teamName || sub.teamName,
            is_admin: Boolean(user.isAdmin),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (insErr) {
          console.error('Supabase profile creation error:', insErr);
          throw insErr;
        }
        profileId = newProf.id;
      }

      // 2. Upsert Prediction
      const { error: predErr } = await supabase.from('predictions').upsert({
        user_id: profileId,
        table_prediction: sub.tablePrediction,
        bespoke_predictions: sub.bespokePredictions,
        is_locked: Boolean(sub.isLocked),
        admin_override: Boolean(sub.adminOverride),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (predErr) {
        console.error('Supabase prediction upsert error:', predErr);
        throw predErr;
      }

      // 3. Ensure league memberships
      const leagueIds = Array.isArray(sub.leagueIds) ? sub.leagueIds : ['global'];
      for (const lId of leagueIds) {
        if (lId !== 'global') {
          await supabase.from('league_members').upsert({
            league_id: lId,
            user_id: profileId,
            joined_at: new Date().toISOString(),
          }, { onConflict: 'league_id,user_id' });
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error('Supabase savePrediction error:', err);
      return { success: false, error: err?.message || String(err) };
    }
  },

  /**
   * Save / Upsert Actual Outcomes to Supabase
   */
  async saveActualOutcomes(outcomes: ActualOutcomes): Promise<boolean> {
    if (!this.isConfigured() || !supabase) return false;

    try {
      await supabase.from('actual_outcomes').upsert({
        id: 'season_2026_27',
        table_standings: outcomes.tableStandings,
        bespoke_results: outcomes.bespokeResults,
        updated_at: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      console.warn('Supabase saveActualOutcomes error:', err);
      return false;
    }
  },

  /**
   * Save / Upsert Categories to Supabase
   */
  async saveCategories(categories: PredictionCategory[]): Promise<boolean> {
    if (!this.isConfigured() || !supabase) return false;

    try {
      const rows = categories.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category_type: c.type,
        options: c.options || [],
        is_default: c.isDefault,
        points_value: c.pointsValue,
      }));

      await supabase.from('prediction_categories').upsert(rows, { onConflict: 'id' });
      return true;
    } catch (err) {
      console.warn('Supabase saveCategories error:', err);
      return false;
    }
  },

  /**
   * Create a new Mini-League in Supabase
   */
  async createLeague(league: League, creatorEmail: string): Promise<boolean> {
    if (!this.isConfigured() || !supabase) return false;

    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', creatorEmail)
        .maybeSingle();

      const { data: newLeague, error } = await supabase.from('leagues').insert({
        name: league.name,
        code: league.code,
        description: league.description,
        is_public: league.isPublic,
        created_by: prof?.id || null,
        created_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;

      if (newLeague && prof?.id) {
        await supabase.from('league_members').insert({
          league_id: newLeague.id,
          user_id: prof.id,
          joined_at: new Date().toISOString(),
        });
      }

      return true;
    } catch (err) {
      console.warn('Supabase createLeague error:', err);
      return false;
    }
  },

  /**
   * Join a League in Supabase
   */
  async joinLeague(leagueId: string, userEmail: string): Promise<boolean> {
    if (!this.isConfigured() || !supabase) return false;

    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      if (prof?.id) {
        await supabase.from('league_members').upsert({
          league_id: leagueId,
          user_id: prof.id,
          joined_at: new Date().toISOString(),
        }, { onConflict: 'league_id,user_id' });
      }
      return true;
    } catch (err) {
      console.warn('Supabase joinLeague error:', err);
      return false;
    }
  },

  /**
   * Delete prediction submission by ID
   */
  async deletePrediction(predictionId: string): Promise<boolean> {
    if (!this.isConfigured() || !supabase) return false;
    try {
      await supabase.from('predictions').delete().eq('id', predictionId);
      return true;
    } catch (err) {
      console.warn('Supabase deletePrediction error:', err);
      return false;
    }
  },

  /**
   * Delete a mini-league by ID
   */
  async deleteLeague(leagueId: string): Promise<boolean> {
    if (!this.isConfigured() || !supabase) return false;
    try {
      await supabase.from('league_members').delete().eq('league_id', leagueId);
      await supabase.from('leagues').delete().eq('id', leagueId);
      return true;
    } catch (err) {
      console.warn('Supabase deleteLeague error:', err);
      return false;
    }
  },

  /**
   * Seed / Insert a custom league directly into Supabase
   */
  async seedCustomLeague(name: string, code: string, description: string, isPublic: boolean, creatorEmail: string): Promise<{ success: boolean; error?: string; league?: any }> {
    if (!this.isConfigured() || !supabase) {
      return { success: false, error: 'Supabase is not configured. Please enter your Supabase URL & Key.' };
    }

    try {
      // Find or create creator profile
      let { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', creatorEmail)
        .maybeSingle();

      if (!prof) {
        const { data: newProf } = await supabase
          .from('profiles')
          .insert({
            email: creatorEmail,
            full_name: 'League Administrator',
            team_name: 'Admin XI',
            is_admin: true,
          })
          .select('id')
          .single();
        prof = newProf;
      }

      // Check if league with this code already exists
      const cleanCode = code.trim().toUpperCase();
      const { data: existingLeague } = await supabase
        .from('leagues')
        .select('id, name, code')
        .eq('code', cleanCode)
        .maybeSingle();

      let leagueResult: any = null;

      if (existingLeague) {
        const { data: updated, error: updateErr } = await supabase
          .from('leagues')
          .update({
            name: name.trim(),
            description: description.trim(),
            is_public: isPublic,
          })
          .eq('id', existingLeague.id)
          .select()
          .single();

        if (updateErr) throw updateErr;
        leagueResult = updated || existingLeague;
      } else {
        const { data: newLeague, error } = await supabase.from('leagues').insert({
          name: name.trim(),
          code: cleanCode,
          description: description.trim(),
          is_public: isPublic,
          created_by: prof?.id || null,
          created_at: new Date().toISOString(),
        }).select().single();

        if (error) throw error;
        leagueResult = newLeague;
      }

      if (leagueResult && prof?.id) {
        await supabase.from('league_members').upsert({
          league_id: leagueResult.id,
          user_id: prof.id,
          joined_at: new Date().toISOString(),
        }, { onConflict: 'league_id,user_id' });
      }

      return { success: true, league: leagueResult };
    } catch (err: any) {
      console.warn('Supabase seedCustomLeague error:', err);
      return { success: false, error: err?.message || String(err) };
    }
  },

  /**
   * Seed default bespoke categories into Supabase
   */
  async seedDefaultCategories(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured() || !supabase) {
      return { success: false, error: 'Supabase is not configured.' };
    }

    try {
      const rows = DEFAULT_PREDICTION_CATEGORIES.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category_type: c.type,
        options: c.options || [],
        is_default: c.isDefault,
        points_value: c.pointsValue || 3,
      }));

      const { error } = await supabase.from('prediction_categories').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  },

  /**
   * Delete user profile, predictions and league memberships
   */
  async deleteUser(userId: string): Promise<boolean> {
    if (!this.isConfigured() || !supabase) return false;
    try {
      await supabase.from('predictions').delete().eq('user_id', userId);
      await supabase.from('league_members').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);
      return true;
    } catch (err) {
      console.warn('Supabase deleteUser error:', err);
      return false;
    }
  },

  /**
   * Purge all demo prediction submissions and demo mini-leagues from Supabase
   */
  async purgeDemoDataFromSupabase(keepAdminEmail: string): Promise<boolean> {
    if (!this.isConfigured() || !supabase) return false;

    try {
      // Find admin profile
      const { data: adminProf } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', keepAdminEmail)
        .maybeSingle();

      const adminId = adminProf?.id;

      // Delete non-admin predictions or all if requested
      if (adminId) {
        await supabase.from('predictions').delete().neq('user_id', adminId);
        await supabase.from('profiles').delete().neq('id', adminId);
        await supabase.from('leagues').delete().neq('is_public', true);
      } else {
        await supabase.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('leagues').delete().neq('is_public', true);
      }

      return true;
    } catch (err) {
      console.warn('Supabase purgeDemoData error:', err);
      return false;
    }
  }
};
