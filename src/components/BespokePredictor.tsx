import React, { useState } from 'react';
import { 
  Sparkles, 
  Trophy, 
  UserMinus, 
  Flame, 
  Award, 
  Globe, 
  Hand, 
  Crown, 
  HelpCircle, 
  Lock, 
  Check, 
  ChevronDown,
  Search,
  PlusCircle
} from 'lucide-react';
import { PredictionCategory } from '../types';

interface BespokePredictorProps {
  categories: PredictionCategory[];
  predictions: Record<string, string>;
  onChange: (categoryId: string, value: string) => void;
  isLocked: boolean;
  canOverride: boolean;
}

export const BespokePredictor: React.FC<BespokePredictorProps> = ({
  categories,
  predictions,
  onChange,
  isLocked,
  canOverride,
}) => {
  const [customInputToggles, setCustomInputToggles] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const disabled = isLocked && !canOverride;

  const answeredCount = categories.filter(c => predictions[c.id] && predictions[c.id].trim() !== '').length;

  const getCategoryIcon = (cat: PredictionCategory) => {
    switch (cat.id) {
      case 'first_manager_sacked':
        return <UserMinus className="w-5 h-5 text-rose-400" />;
      case 'top_goal_scorer':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'top_assists':
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
      case 'league_cup_winners':
      case 'fa_cup_winners':
        return <Trophy className="w-5 h-5 text-emerald-400" />;
      case 'uefa_cup_winners':
      case 'champions_league_winners':
        return <Globe className="w-5 h-5 text-blue-400" />;
      case 'pfa_player_of_season':
      case 'balon_dor':
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 'golden_gloves':
        return <Hand className="w-5 h-5 text-teal-400" />;
      case 'pfa_young_player':
        return <Award className="w-5 h-5 text-purple-400" />;
      default:
        return <Award className="w-5 h-5 text-purple-400" />;
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    cat.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white font-['Outfit']">
              Bespoke & Cup Predictions
            </h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
              answeredCount === categories.length
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700/50'
                : 'bg-purple-950 text-purple-300 border-purple-700/50'
            }`}>
              {answeredCount} of {categories.length} Selected
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Predict season outcomes, individual awards, and cup winners. Correct pick = <strong className="text-purple-300">3 pts each</strong>.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-bespoke-categories"
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCategories.map((cat) => {
          const selectedValue = predictions[cat.id] || '';
          const isAnswered = Boolean(selectedValue && selectedValue.trim() !== '');
          const isCustomMode = customInputToggles[cat.id] || (isAnswered && cat.options && !cat.options.includes(selectedValue));

          return (
            <div
              key={cat.id}
              id={`bespoke-card-${cat.id}`}
              className={`p-4 rounded-xl border transition-all ${
                isAnswered
                  ? 'bg-slate-950/90 border-purple-800/60 shadow-md shadow-purple-950/40'
                  : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Category Title & Icon */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    {getCategoryIcon(cat)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      {cat.title}
                      {!cat.isDefault && (
                        <span className="text-[9px] bg-indigo-950 text-indigo-300 px-1.5 py-0.2 rounded font-semibold border border-indigo-800">
                          Bespoke
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{cat.description}</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 shrink-0">
                  +{cat.pointsValue || 3} pts
                </span>
              </div>

              {/* Selection Controls */}
              <div className="mt-3 space-y-2">
                {!isCustomMode && cat.options && cat.options.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      id={`select-bespoke-${cat.id}`}
                      value={selectedValue}
                      disabled={disabled}
                      onChange={(e) => {
                        if (e.target.value === '__OTHER_CUSTOM__') {
                          setCustomInputToggles(prev => ({ ...prev, [cat.id]: true }));
                        } else {
                          onChange(cat.id, e.target.value);
                        }
                      }}
                      aria-label={`Select ${cat.title}`}
                      className="w-full bg-slate-900 border border-slate-700 hover:border-purple-500 disabled:opacity-60 text-white text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Choose your prediction --</option>
                      {cat.options.map((opt) => (
                        <option key={opt} value={opt} className="bg-slate-900 text-white">
                          {opt}
                        </option>
                      ))}
                      <option value="__OTHER_CUSTOM__">✍️ Enter Custom Name / Other...</option>
                    </select>

                    {/* Quick Choice Suggestion Chips (top 3) */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-medium">Quick Pick:</span>
                      {cat.options.slice(0, 3).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          disabled={disabled}
                          onClick={() => onChange(cat.id, opt)}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                            selectedValue === opt
                              ? 'bg-purple-600 text-white border-purple-500 font-bold'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-purple-500/50'
                          }`}
                        >
                          {opt.split(' (')[0]}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCustomInputToggles(prev => ({ ...prev, [cat.id]: true }))}
                        className="text-[10px] text-purple-400 hover:text-purple-300 underline ml-auto"
                      >
                        Custom text
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        id={`input-custom-bespoke-${cat.id}`}
                        type="text"
                        disabled={disabled}
                        placeholder={`Type predicted ${cat.title.toLowerCase()}...`}
                        value={selectedValue}
                        onChange={(e) => onChange(cat.id, e.target.value)}
                        className="w-full bg-slate-900 border border-purple-500/70 disabled:opacity-60 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      {cat.options && cat.options.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setCustomInputToggles(prev => ({ ...prev, [cat.id]: false }))}
                          className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-2 rounded-xl shrink-0"
                          title="Switch back to dropdown list"
                        >
                          List
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Selected Status Tag */}
                {isAnswered && (
                  <div className="flex items-center justify-between text-[11px] text-purple-300/90 pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Locked Pick: <strong className="text-white ml-0.5">{selectedValue}</strong>
                    </span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => onChange(cat.id, '')}
                        className="text-slate-500 hover:text-rose-400 text-[10px]"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
