import React, { useState } from 'react';
import { X, UserCircle, Shield, Sparkles, Check, LogIn } from 'lucide-react';
import { CurrentUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  onSaveUser: (user: CurrentUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveUser,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [teamName, setTeamName] = useState(currentUser.teamName);
  const [email, setEmail] = useState(currentUser.email);
  const [isAdmin, setIsAdmin] = useState(currentUser.isAdmin);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUser({
      ...currentUser,
      name: name.trim() || 'Predictor',
      teamName: teamName.trim() || 'My Fantasy XI',
      email: email.trim() || 'user@example.com',
      isAdmin,
    });
    onClose();
  };

  const demoAccounts = [
    { name: 'Josh Birchall (Admin)', teamName: 'The Invincible Pundits', email: 'joshbirchall9@gmail.com', isAdmin: true },
    { name: 'Liam Henderson', teamName: 'Slot Machine Reds', email: 'liam.h@example.com', isAdmin: false },
    { name: 'Emma Watson-Smith', teamName: 'Arteta\'s Geometry', email: 'emma.ws@example.com', isAdmin: false },
    { name: 'Marcus Cole', teamName: 'Maresca Ball Express', email: 'marcus.c@example.com', isAdmin: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-950 to-slate-900 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <UserCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit']">
                Predictor Profile & Sign In
              </h2>
              <p className="text-xs text-slate-400">Configure your predictor identity and team</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Switch Switcher */}
        <div className="p-4 bg-slate-950 border-b border-slate-800">
          <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-2">
            Quick Switch Demo Profile:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.name}
                type="button"
                onClick={() => {
                  setName(acc.name.split(' (')[0]);
                  setTeamName(acc.teamName);
                  setEmail(acc.email);
                  setIsAdmin(acc.isAdmin);
                }}
                className={`p-2 rounded-lg text-left text-xs border transition-all ${
                  email === acc.email
                    ? 'bg-purple-950/60 border-purple-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold truncate">{acc.name}</div>
                <div className="text-[10px] text-purple-400 truncate">{acc.teamName}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Edit Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Your Full Name *</label>
            <input
              id="input-auth-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Prediction Team Name *</label>
            <input
              id="input-auth-team"
              type="text"
              required
              placeholder="e.g. Josh's Tactical Geniuses"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              id="input-auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Admin Toggle */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-white">Administrator Role</div>
                <div className="text-[10px] text-slate-400">Enables site locking, outcomes & category management</div>
              </div>
            </div>

            <input
              id="toggle-admin-role"
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              id="btn-save-auth-profile"
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
