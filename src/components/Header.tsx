import React from 'react';
import { 
  Trophy, 
  Shield, 
  BarChart3, 
  Users, 
  Sliders, 
  BookOpen, 
  Lock, 
  Unlock, 
  UserCircle,
  Table as TableIcon,
  Sparkles
} from 'lucide-react';
import { CurrentUser, League } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: CurrentUser;
  onOpenAuth: () => void;
  isPredictionsLocked: boolean;
  selectedLeagueId: string;
  onSelectLeague: (leagueId: string) => void;
  leagues: League[];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  isPredictionsLocked,
  selectedLeagueId,
  onSelectLeague,
  leagues,
}) => {
  const currentLeague = leagues.find(l => l.id === selectedLeagueId) || leagues[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
      {/* Top Banner / Ticker */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 px-4 py-1.5 text-xs text-purple-200 border-b border-purple-800/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] uppercase tracking-wider">
              2026/27 Season
            </span>
            <span className="text-slate-300 hidden sm:inline">Premier League Football Prediction Engine</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              {isPredictionsLocked ? (
                <span className="inline-flex items-center gap-1 text-amber-400 font-medium bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">
                  <Lock className="w-3 h-3" /> Locked for Season
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50">
                  <Unlock className="w-3 h-3" /> Submissions Open
                </span>
              )}
            </div>

            <div className="text-slate-400 hidden md:block">
              Points: <span className="text-white font-semibold">Exact Table = 3pts</span> | <span className="text-white font-semibold">±1 Pos = 1pt</span> | <span className="text-white font-semibold">Bespoke = 3pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & Branding */}
          <div 
            id="brand-logo-button"
            onClick={() => setActiveTab('predict')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-['Outfit']">
                  PREMIER<span className="text-purple-400">PREDICTOR</span>
                </span>
                <span className="bg-purple-950/80 text-purple-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-700/50">
                  26/27
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Table & Bespoke Football Predictions</p>
            </div>
          </div>

          {/* User & League Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* League Switcher */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">League:</span>
              <select
                id="header-league-select"
                value={selectedLeagueId}
                onChange={(e) => onSelectLeague(e.target.value)}
                aria-label="Select active league"
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-2"
              >
                {leagues.map((l) => (
                  <option key={l.id} value={l.id} className="bg-slate-900 text-white">
                    {l.name} {l.isPublic ? '(Global)' : `(${l.code})`}
                  </option>
                ))}
              </select>
            </div>

            {/* User Profile Pill */}
            <button
              id="user-profile-button"
              onClick={onOpenAuth}
              className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 rounded-xl px-3 py-1.5 transition-all text-left group"
            >
              <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1.5">
                  {currentUser.name}
                  {currentUser.isAdmin && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold border border-amber-500/30">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-purple-300/80 truncate max-w-[120px]">
                  {currentUser.teamName || 'Set Team Name'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="mt-3 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-t border-slate-800/80 pt-2">
          <button
            id="nav-predict-tab"
            onClick={() => setActiveTab('predict')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'predict'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            My Predictions
          </button>

          <button
            id="nav-leaderboard-tab"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Predictor Leaderboard
          </button>

          <button
            id="nav-standings-tab"
            onClick={() => setActiveTab('standings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'standings'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            Live PL Standings
          </button>

          <button
            id="nav-leagues-tab"
            onClick={() => setActiveTab('leagues')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'leagues'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Mini-Leagues ({leagues.length})
          </button>

          <button
            id="nav-admin-tab"
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'admin'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Admin Console
          </button>

          <button
            id="nav-guide-tab"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ml-auto ${
              activeTab === 'guide'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                : 'text-indigo-400 hover:text-indigo-200 bg-indigo-950/40 border border-indigo-800/40 hover:bg-indigo-900/40'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Setup & Deployment Guide
          </button>
        </nav>
      </div>
    </header>
  );
};
