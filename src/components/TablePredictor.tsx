import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ArrowUpDown, 
  RotateCcw, 
  Sparkles, 
  Shield, 
  Lock, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { Team } from '../types';
import { PREMIER_LEAGUE_TEAMS_2026_27, getTeamById } from '../data/teams2026';

interface TablePredictorProps {
  predictedTeamIds: string[];
  onChange: (teamIds: string[]) => void;
  isLocked: boolean;
  canOverride: boolean;
}

export const TablePredictor: React.FC<TablePredictorProps> = ({
  predictedTeamIds,
  onChange,
  isLocked,
  canOverride,
}) => {
  const [selectedTeamIndex, setSelectedTeamIndex] = useState<number | null>(null);

  const disabled = isLocked && !canOverride;

  const moveTeam = (fromIndex: number, toIndex: number) => {
    if (disabled) return;
    if (toIndex < 0 || toIndex >= predictedTeamIds.length) return;
    
    const newOrder = [...predictedTeamIds];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    onChange(newOrder);
    setSelectedTeamIndex(null);
  };

  const swapTeams = (indexA: number, indexB: number) => {
    if (disabled) return;
    if (indexA < 0 || indexA >= predictedTeamIds.length || indexB < 0 || indexB >= predictedTeamIds.length) return;
    const newOrder = [...predictedTeamIds];
    const temp = newOrder[indexA];
    newOrder[indexA] = newOrder[indexB];
    newOrder[indexB] = temp;
    onChange(newOrder);
    setSelectedTeamIndex(null);
  };

  const handleQuickPreset = (type: 'default' | 'alphabetical' | 'promoted-relegated') => {
    if (disabled) return;
    let newOrder: string[] = [];
    if (type === 'default') {
      newOrder = PREMIER_LEAGUE_TEAMS_2026_27.map(t => t.id);
    } else if (type === 'alphabetical') {
      newOrder = [...PREMIER_LEAGUE_TEAMS_2026_27].sort((a, b) => a.name.localeCompare(b.name)).map(t => t.id);
    } else if (type === 'promoted-relegated') {
      const promoted = PREMIER_LEAGUE_TEAMS_2026_27.filter(t => t.isPromoted).map(t => t.id);
      const nonPromoted = PREMIER_LEAGUE_TEAMS_2026_27.filter(t => !t.isPromoted).map(t => t.id);
      newOrder = [...nonPromoted, ...promoted];
    }
    onChange(newOrder);
    setSelectedTeamIndex(null);
  };

  const getZoneInfo = (position: number) => {
    if (position >= 1 && position <= 4) {
      return {
        name: 'Champions League',
        badgeColor: 'bg-blue-950 text-blue-300 border-blue-800',
        borderColor: 'border-l-4 border-l-blue-500',
        label: 'UCL (1-4)',
      };
    }
    if (position === 5) {
      return {
        name: 'Europa League',
        badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
        borderColor: 'border-l-4 border-l-amber-500',
        label: 'UEL (5)',
      };
    }
    if (position === 6) {
      return {
        name: 'Conference League',
        badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
        borderColor: 'border-l-4 border-l-emerald-500',
        label: 'UECL (6)',
      };
    }
    if (position >= 18 && position <= 20) {
      return {
        name: 'Relegation Zone',
        badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
        borderColor: 'border-l-4 border-l-rose-500',
        label: 'Relegation',
      };
    }
    return {
      name: 'Mid Table',
      badgeColor: 'bg-slate-900 text-slate-400 border-slate-800',
      borderColor: 'border-l-4 border-l-slate-800',
      label: 'PL',
    };
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white font-['Outfit']">
              1-20 Premier League Table Predictor
            </h2>
            <span className="bg-purple-900/60 text-purple-300 text-xs px-2 py-0.5 rounded-full font-semibold border border-purple-700/40">
              20/20 Placed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Order all 20 clubs. Exact finish = <strong className="text-purple-300">3 pts</strong>, within ±1 place = <strong className="text-purple-300">1 pt</strong>.
          </p>
        </div>

        {/* Action Presets */}
        {!disabled && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500 font-medium">Presets:</span>
            <button
              id="preset-default-btn"
              type="button"
              onClick={() => handleQuickPreset('default')}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              title="Reset to 2026/27 seed ranking"
            >
              Default Seed
            </button>
            <button
              id="preset-alphabetical-btn"
              type="button"
              onClick={() => handleQuickPreset('alphabetical')}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              title="Sort Alphabetically A-Z"
            >
              A-Z
            </button>
            <button
              id="preset-promoted-btn"
              type="button"
              onClick={() => handleQuickPreset('promoted-relegated')}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              title="Place promoted clubs in relegation zone"
            >
              Promoted Bottom
            </button>
          </div>
        )}
      </div>

      {/* Lock Notice if locked */}
      {isLocked && (
        <div className="mt-4 p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Predictions are currently <strong>locked for the 2026/27 season</strong>.
              {canOverride ? ' You have Admin Override privileges to modify.' : ' Table order cannot be modified.'}
            </span>
          </div>
        </div>
      )}

      {/* Zone Legend */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-1.5 bg-slate-950/60 border border-blue-900/50 p-2 rounded-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span className="text-slate-300 font-medium">1st - 4th:</span>
          <span className="text-blue-400 font-semibold">Champions League</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-950/60 border border-amber-900/50 p-2 rounded-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-slate-300 font-medium">5th:</span>
          <span className="text-amber-400 font-semibold">Europa League</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-950/60 border border-emerald-900/50 p-2 rounded-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-300 font-medium">6th:</span>
          <span className="text-emerald-400 font-semibold">Conference League</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-950/60 border border-rose-900/50 p-2 rounded-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span className="text-slate-300 font-medium">18th - 20th:</span>
          <span className="text-rose-400 font-semibold">Relegation</span>
        </div>
      </div>

      {/* 1-20 Ranking List */}
      <div className="mt-4 space-y-1.5">
        {predictedTeamIds.map((teamId, index) => {
          const position = index + 1;
          const team = getTeamById(teamId);
          const zone = getZoneInfo(position);
          const isSelected = selectedTeamIndex === index;

          if (!team) return null;

          return (
            <div
              key={team.id}
              id={`table-row-pos-${position}`}
              className={`flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl transition-all duration-150 ${
                zone.borderColor
              } ${
                isSelected 
                  ? 'bg-purple-950/70 border-purple-500 shadow-lg shadow-purple-950' 
                  : 'bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80'
              }`}
            >
              {/* Position & Team Details */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Position Badge */}
                <div 
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${
                    position === 1 
                      ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300 shadow-md shadow-amber-500/20' 
                      : position <= 4 
                        ? 'bg-blue-600 text-white font-bold' 
                        : position === 5 
                          ? 'bg-amber-600 text-white font-bold' 
                          : position === 6 
                            ? 'bg-emerald-600 text-white font-bold' 
                            : position >= 18 
                              ? 'bg-rose-700 text-white font-bold' 
                              : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {position}
                </div>

                {/* Team Kit Color Pill */}
                <div 
                  className="w-3.5 h-8 rounded-md shrink-0 shadow-inner border border-white/20"
                  style={{ backgroundColor: team.primaryColor }}
                  title={`${team.name} Primary Kit`}
                />

                {/* Team Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm sm:text-base text-white tracking-tight truncate">
                      {team.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded uppercase">
                      {team.code}
                    </span>
                    {team.isPromoted && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/50 px-1.5 py-0.2 rounded font-semibold">
                        Promoted
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate flex items-center gap-2 mt-0.5">
                    <span>Mgr: {team.manager}</span>
                    <span className="hidden md:inline text-slate-600">•</span>
                    <span className="hidden md:inline">{team.stadium}</span>
                  </div>
                </div>
              </div>

              {/* Reordering Controls & Quick Swap Selector */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Zone Label Badge on Desktop */}
                <span className={`hidden lg:inline-block text-[11px] px-2 py-0.5 rounded border font-medium ${zone.badgeColor}`}>
                  {zone.label}
                </span>

                {/* Direct Rank Dropdown Selector */}
                {!disabled && (
                  <select
                    id={`pos-jump-select-${team.id}`}
                    value={position}
                    onChange={(e) => {
                      const targetPos = parseInt(e.target.value, 10) - 1;
                      moveTeam(index, targetPos);
                    }}
                    aria-label={`Change position for ${team.name}`}
                    className="bg-slate-900 border border-slate-700 hover:border-purple-500 text-purple-300 text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                  >
                    {predictedTeamIds.map((_, pIdx) => (
                      <option key={pIdx} value={pIdx + 1} className="bg-slate-900 text-white">
                        Pos #{pIdx + 1}
                      </option>
                    ))}
                  </select>
                )}

                {/* Move Up Button */}
                {!disabled && (
                  <button
                    id={`btn-move-up-${team.id}`}
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveTeam(index, index - 1)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 disabled:opacity-30 disabled:hover:bg-slate-800 text-white transition-colors"
                    title="Move up 1 position"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                )}

                {/* Move Down Button */}
                {!disabled && (
                  <button
                    id={`btn-move-down-${team.id}`}
                    type="button"
                    disabled={index === predictedTeamIds.length - 1}
                    onClick={() => moveTeam(index, index + 1)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 disabled:opacity-30 disabled:hover:bg-slate-800 text-white transition-colors"
                    title="Move down 1 position"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
