import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Terminal, 
  Database, 
  Globe, 
  GitBranch, 
  Copy, 
  Check, 
  Laptop, 
  Layers, 
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  ExternalLink,
  Code
} from 'lucide-react';

export const DeploymentGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'windows' | 'supabase' | 'vercel' | 'git'>('matrix');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const supabaseSqlSchema = `-- ==============================================================================
-- PREMIER PREDICTOR 2026/27 - SUPABASE POSTGRESQL DATABASE SCHEMA
-- Free-Tier Compatible (Scale-to-Zero, RLS Policies, Automatic Timestamps)
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & USERS TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    team_name TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. LEAGUES TABLE (Supports Global and Private Mini-Leagues)
CREATE TABLE IF NOT EXISTS public.leagues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. LEAGUE MEMBERS TABLE (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS public.league_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(league_id, user_id)
);

-- 4. PREDICTION CATEGORIES TABLE (Default 11 + Bespoke categories added by Admin)
CREATE TABLE IF NOT EXISTS public.prediction_categories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category_type VARCHAR(20) DEFAULT 'custom',
    options JSONB DEFAULT '[]'::jsonb,
    is_default BOOLEAN DEFAULT FALSE,
    points_value INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. USER PREDICTIONS SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    table_prediction JSONB NOT NULL, -- Array of 20 team IDs in 1st to 20th order
    bespoke_predictions JSONB NOT NULL, -- Key-value map of category_id -> answer
    is_locked BOOLEAN DEFAULT FALSE,
    admin_override BOOLEAN DEFAULT FALSE,
    total_score INTEGER DEFAULT 0,
    table_score INTEGER DEFAULT 0,
    bespoke_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ACTUAL OUTCOMES & WINNERS TABLE (Admin-Resolved)
CREATE TABLE IF NOT EXISTS public.actual_outcomes (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'season_2026_27',
    table_standings JSONB NOT NULL, -- Live 1st to 20th team IDs
    bespoke_results JSONB NOT NULL, -- Map of category_id -> confirmed winning outcome
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. SITE METRICS & HIT COUNTERS TABLE
CREATE TABLE IF NOT EXISTS public.site_metrics (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'global_metrics',
    total_hits BIGINT DEFAULT 0,
    page_views BIGINT DEFAULT 0,
    unique_visitors BIGINT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actual_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running to avoid duplicate policy errors
DROP POLICY IF EXISTS "Profiles access policy" ON public.profiles;
DROP POLICY IF EXISTS "Leagues access policy" ON public.leagues;
DROP POLICY IF EXISTS "League members access policy" ON public.league_members;
DROP POLICY IF EXISTS "Categories access policy" ON public.prediction_categories;
DROP POLICY IF EXISTS "Predictions access policy" ON public.predictions;
DROP POLICY IF EXISTS "Actual outcomes access policy" ON public.actual_outcomes;
DROP POLICY IF EXISTS "Site metrics access policy" ON public.site_metrics;

-- Permissive policies for full-featured anonymous & authenticated client access
CREATE POLICY "Profiles access policy" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Leagues access policy" ON public.leagues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "League members access policy" ON public.league_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Categories access policy" ON public.prediction_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Predictions access policy" ON public.predictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Actual outcomes access policy" ON public.actual_outcomes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Site metrics access policy" ON public.site_metrics FOR ALL USING (true) WITH CHECK (true);

-- Insert Default Global League
INSERT INTO public.leagues (id, name, code, is_public, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'Premier League Global 2026/27', 'PL2627', TRUE, 'Global worldwide league')
ON CONFLICT (code) DO NOTHING;
`;

  const gitWorkflowCommands = `# 1. Open VS Code on your Windows 10 Laptop
# 2. Open Git Bash or Integrated Terminal (Ctrl + \`)
# 3. Initialize fresh Git repository & connect to your repo:
git init
git remote add origin https://github.com/mlbirchall77-beep/premier-predictor.git

# 4. Create and checkout the local 'develop' branch:
git checkout -b develop

# 5. Add files, commit and push to develop:
git add .
git commit -m "feat: initial release of Premier Predictor 2026/27"
git push -u origin develop

# 6. When ready to publish to Production (Vercel):
git checkout -b main
git merge develop
git push -u origin main

# 7. For future daily work on Windows 10:
# Always do your edits on 'develop', test locally (npm run dev),
# then merge 'develop' into 'main' and push 'main' to trigger Vercel deploy!`;

  const vercelEnvVars = `# .env for local development & Vercel Project Settings

# 1. Supabase Free Tier credentials (from Supabase Dashboard -> Settings -> API)
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Football API (Optional - free tier token from football-data.org)
VITE_FOOTBALL_DATA_API_KEY=""

# 3. Environment Identifier
VITE_APP_ENV="production"
`;

  const copyToClipboard = (text: string, type: 'sql' | 'git' | 'env') => {
    navigator.clipboard.writeText(text);
    if (type === 'sql') {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } else if (type === 'git') {
      setCopiedGit(true);
      setTimeout(() => setCopiedGit(false), 2000);
    } else {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
              Architecture, Setup & Deployment Blueprint
            </h1>
            <p className="text-xs text-slate-400">
              Complete step-by-step implementation guide for Windows 10, VS Code, Git, Supabase, and Vercel.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            Automated vs. Manual Matrix
          </button>
          <button
            onClick={() => setActiveTab('windows')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'windows' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 inline mr-1" />
            Windows 10 & VS Code Setup
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'supabase' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            <Database className="w-3.5 h-3.5 inline mr-1" />
            Supabase DB Schema & SQL
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'vercel' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            <Globe className="w-3.5 h-3.5 inline mr-1" />
            Vercel Free-Tier Hosting
          </button>
          <button
            onClick={() => setActiveTab('git')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'git' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 inline mr-1" />
            Git Workflow (Develop → Main)
          </button>
        </div>
      </div>

      {/* Tab 1: Automated vs Manual Implementation Breakdown */}
      {activeTab === 'matrix' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            What is Automated vs. What Needs Manual Implementation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Automated Box */}
            <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Fully Automated in Code (Zero Maintenance)</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li><strong>1-20 Table Scoring Calculation</strong>: Exact finish = 3pts, ±1 place = 1pt. Computed instantaneously via reactive state engine.</li>
                <li><strong>Predictor Leaderboard Rankings</strong>: Dynamic real-time sorting with tie-breaker priority (Total pts → Exact table matches → Bespoke hits).</li>
                <li><strong>Live Standings Synchronization</strong>: Automatic fetching from Premier League API or fallback Matchday 28 simulator.</li>
                <li><strong>League Code Generation</strong>: Unique 6-character cryptographic keys (e.g. <code>BANTER</code>, <code>PUNDIT</code>) for instant friend joins.</li>
                <li><strong>Locking Enforcement</strong>: Disables user prediction form inputs once admin locks season or kickoff deadline passes.</li>
                <li><strong>Continuous Vercel Deployment</strong>: Git pushes to <code>main</code> trigger automated preview builds and live production deploys.</li>
                <li><strong>Hit & Metric Counters</strong>: Automated incrementing of site hits, page views, and submission tallies.</li>
              </ul>
            </div>

            {/* Manual Box */}
            <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Manual Admin Tasks Required (Step-by-Step)</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li><strong>Supabase Database Creation</strong>: Creating free Supabase project and running provided SQL script (1-time, ~2 mins).</li>
                <li><strong>Setting Season Lock Date</strong>: Toggling "Lock Submissions" in Admin Console when Gameweek 1 kicks off.</li>
                <li><strong>Resolving Award Winners</strong>: Selecting winners in the Admin Console (e.g., Golden Boot, Ballon d'Or, Sacked Managers) as they are confirmed.</li>
                <li><strong>Adding Custom Bespoke Categories</strong>: Creating non-default questions (e.g., "Lowest Scoring Team") via Admin category form.</li>
                <li><strong>Linking GitHub to Vercel</strong>: Selecting <code>main</code> branch in Vercel project settings (1-time setup).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Windows 10 & VS Code Setup */}
      {activeTab === 'windows' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Laptop className="w-5 h-5 text-indigo-400" />
            Windows 10 Laptop & Visual Studio Code Step-by-Step Setup
          </h2>

          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">1</span>
                Install Prerequisites on Windows 10
              </h3>
              <p className="text-slate-400">Make sure you have Node.js (v18+) and Git installed on your Windows 10 machine:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li><strong>Node.js LTS</strong>: Download from <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-purple-400 underline">nodejs.org</a> (includes npm).</li>
                <li><strong>Git for Windows</strong>: Download from <a href="https://git-scm.com/download/win" target="_blank" rel="noreferrer" className="text-purple-400 underline">git-scm.com</a>.</li>
                <li><strong>Visual Studio Code</strong>: Download from <a href="https://code.visualstudio.com" target="_blank" rel="noreferrer" className="text-purple-400 underline">code.visualstudio.com</a>.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">2</span>
                Recommended VS Code Extensions
              </h3>
              <p className="text-slate-400">Open VS Code extensions tab (<code>Ctrl + Shift + X</code>) and install:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li><strong>Tailwind CSS IntelliSense</strong> (by Tailwind Labs)</li>
                <li><strong>ESLint & Prettier</strong> (Code formatting)</li>
                <li><strong>GitLens</strong> (Visual Git branches & history)</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">3</span>
                Running the App Locally in VS Code Terminal
              </h3>
              <p className="text-slate-400">Press <code>Ctrl + `</code> in VS Code to open the integrated terminal and run:</p>
              <pre className="p-3 bg-slate-900 rounded-lg text-purple-300 font-mono overflow-x-auto text-[11px]">
{`# Install project dependencies
npm install

# Start the fast local development server with hot-reload
npm run dev

# Open your browser at: http://localhost:3000`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Supabase Database Schema & SQL */}
      {activeTab === 'supabase' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                Supabase Free-Tier Database Schema & SQL Script
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact PostgreSQL tables, fields, constraints, indexes, and Row Level Security (RLS) policies.
              </p>
            </div>

            <button
              id="copy-sql-btn"
              onClick={() => copyToClipboard(supabaseSqlSchema, 'sql')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 transition-all"
            >
              {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedSql ? 'Copied to Clipboard!' : 'Copy Full SQL Script'}
            </button>
          </div>

          {/* Database Setup Steps */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
            <h4 className="font-bold text-white">How to apply this schema in 3 clicks:</h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Log in to your free account at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-purple-400 underline">supabase.com</a>.</li>
              <li>Create a new project (select the free tier, pick a region close to your users).</li>
              <li>Click <strong>SQL Editor</strong> in the left sidebar → click <strong>New Query</strong> → Paste the SQL below → Click <strong>Run</strong>.</li>
            </ol>
          </div>

          {/* SQL Viewer */}
          <div className="relative">
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-emerald-300 font-mono text-[11px] max-h-[400px] overflow-y-auto leading-relaxed">
              {supabaseSqlSchema}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: Vercel Free-Tier Hosting */}
      {activeTab === 'vercel' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            Vercel Free-Tier Hosting & Deployment Guide
          </h2>

          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">1</span>
                Connect GitHub to Vercel
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>Log in to <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-purple-400 underline">vercel.com</a> with your GitHub account.</li>
                <li>Click <strong>Add New Project</strong> → Import <code>mlbirchall77-beep/premier-predictor</code>.</li>
                <li>Framework Preset: <strong>Vite</strong>.</li>
                <li>Build Command: <code>npm run build</code> (pre-configured).</li>
                <li>Output Directory: <code>dist</code> (pre-configured).</li>
              </ol>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">2</span>
                  Vercel Environment Variables
                </h3>
                <button
                  onClick={() => copyToClipboard(vercelEnvVars, 'env')}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
                >
                  {copiedEnv ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedEnv ? 'Copied' : 'Copy Variables'}
                </button>
              </div>
              <p className="text-slate-400">In Vercel Settings → <strong>Environment Variables</strong>, add:</p>
              <pre className="p-3 bg-slate-900 rounded-lg text-purple-300 font-mono text-[11px] overflow-x-auto">
                {vercelEnvVars}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Git Workflow & GitHub Repo */}
      {activeTab === 'git' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-400" />
                Git Branching Strategy (`develop` vs `main`)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Repository: <code>https://github.com/mlbirchall77-beep/premier-predictor</code>
              </p>
            </div>

            <button
              id="copy-git-btn"
              onClick={() => copyToClipboard(gitWorkflowCommands, 'git')}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 transition-all"
            >
              {copiedGit ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedGit ? 'Copied Commands!' : 'Copy Terminal Commands'}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-xs">Branching Architecture Flow:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900 border border-purple-800/40 rounded-lg">
                <div className="font-bold text-purple-300">🌱 develop (Local Sandbox)</div>
                <p className="text-slate-400 text-[11px] mt-1">
                  Active day-to-day coding on Windows 10. Run <code>npm run dev</code> locally to visualize preview before any production impact.
                </p>
              </div>

              <div className="p-3 bg-slate-900 border border-emerald-800/40 rounded-lg">
                <div className="font-bold text-emerald-300">🚀 main (Vercel Production)</div>
                <p className="text-slate-400 text-[11px] mt-1">
                  Merge <code>develop</code> into <code>main</code> when changes are ready. Vercel automatically deploys <code>main</code> to your live web domain.
                </p>
              </div>
            </div>
          </div>

          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-purple-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
            {gitWorkflowCommands}
          </pre>
        </div>
      )}
    </div>
  );
};
