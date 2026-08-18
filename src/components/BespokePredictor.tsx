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

              {/* Selection Controls - 100% Manual Entry */}
              <div className="mt-3 space-y-2">
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      id={`input-bespoke-${cat.id}`}
                      type="text"
                      disabled={disabled}
                      placeholder={`Enter ${cat.title.toLowerCase()} manually...`}
                      value={selectedValue}
                      onChange={(e) => onChange(cat.id, e.target.value)}
                      className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all disabled:opacity-60 ${
                        isAnswered 
                          ? 'border-purple-500/80 ring-1 ring-purple-500/30' 
                          : 'border-slate-700 focus:border-purple-500'
                      }`}
                    />
                    {selectedValue && !disabled && (
                      <button
                        type="button"
                        onClick={() => onChange(cat.id, '')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-400 text-[11px] p-1 rounded hover:bg-slate-800 transition-colors"
                        title="Clear prediction"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Optional Suggestion Quick-Chips */}
                {cat.options && cat.options.length > 0 && !disabled && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-slate-500 font-medium">Suggestions:</span>
                    {cat.options.slice(0, 4).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(cat.id, opt)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          selectedValue.toLowerCase() === opt.toLowerCase()
                            ? 'bg-purple-600 text-white border-purple-500 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {opt.split(' (')[0]}
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Status Tag */}
                {isAnswered && (
                  <div className="flex items-center justify-between text-[11px] text-purple-300/90 pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Manual Pick: <strong className="text-white ml-0.5">{selectedValue}</strong>
                    </span>
                    {!disabled && (
                      <span className="text-slate-500 text-[10px]">
                        Editable until deadline
                      </span>
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
