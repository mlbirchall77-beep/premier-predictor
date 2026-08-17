import React from 'react';
import { X, Trophy, CheckCircle2, AlertCircle, MinusCircle, Shield } from 'lucide-react';
import { UserScoreBreakdown } from '../types';

interface ScoreBreakdownModalProps {
  score: UserScoreBreakdown | null;
  onClose: () => void;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({ score, onClose }) => {
  if (!score) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded text-xs border border-amber-500/30">
                Rank #{score.rank}
              </span>
              <h2 className="text-xl font-bold text-white font-['Outfit']">
                {score.teamName}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Predictor: <strong className="text-purple-300">{score.userName}</strong>
            </p>
          </div>

          <button
            id="close-score-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Summary Metrics */}
        <div className="grid grid-cols-4 gap-2 p-4 bg-slate-950 border-b border-slate-800 text-center">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-purple-500/40">
            <div className="text-xl sm:text-2xl font-black text-purple-400">{score.totalPoints}</div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Points</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-xl sm:text-2xl font-black text-emerald-400">{score.exactTableCount}</div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Exact Table (3pts)</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-xl sm:text-2xl font-black text-amber-400">{score.oneOffTableCount}</div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">±1 Pos (1pt)</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-xl sm:text-2xl font-black text-indigo-400">{score.exactBespokeCount}</div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Bespoke Hits</div>
          </div>
        </div>

        {/* Items List */}
        <div className="p-4 overflow-y-auto space-y-4 max-h-[60vh]">
          {/* Table Predictions Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              1-20 Premier League Table Scoring ({score.tablePoints} pts)
            </h3>
            <div className="space-y-1.5">
              {score.items.filter(i => i.type === 'table').map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs gap-3 ${
                    item.points === 3
                      ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-100'
                      : item.points === 1
                        ? 'bg-amber-950/30 border-amber-800/70 text-amber-100'
                        : 'bg-slate-950/60 border-slate-800/70 text-slate-400'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{item.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      Predicted: <span className="text-slate-200">{item.predicted}</span> | {item.actual}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.points === 3 && (
                      <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> +3 pts (Exact)
                      </span>
                    )}
                    {item.points === 1 && (
                      <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30 text-xs">
                        <AlertCircle className="w-3.5 h-3.5" /> +1 pt (±1 Pos)
                      </span>
                    )}
                    {item.points === 0 && (
                      <span className="flex items-center gap-1 bg-slate-800 text-slate-400 font-medium px-2 py-0.5 rounded text-xs">
                        0 pts
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bespoke Predictions Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-indigo-400" />
              Bespoke & Cup Predictions Scoring ({score.bespokePoints} pts)
            </h3>
            <div className="space-y-1.5">
              {score.items.filter(i => i.type === 'bespoke').map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs gap-3 ${
                    item.points > 0
                      ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-100'
                      : 'bg-slate-950/60 border-slate-800/70 text-slate-400'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{item.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Picked: <span className="text-slate-200">{item.predicted}</span> | Result: <span className="text-indigo-300">{item.actual}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.points > 0 ? (
                      <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> +{item.points} pts
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-400 font-medium px-2 py-0.5 rounded text-xs">
                        {item.actual.includes('Pending') ? 'Pending' : '0 pts'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
