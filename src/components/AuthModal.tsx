import React, { useState } from 'react';
import { X, UserCircle, Shield, Sparkles, Check, LogIn, Lock, KeyRound, AlertCircle } from 'lucide-react';
import { AdminSettings, CurrentUser } from '../types';
import { storage } from '../lib/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  onSaveUser: (user: CurrentUser) => void;
  adminSettings: AdminSettings;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveUser,
  adminSettings,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [teamName, setTeamName] = useState(currentUser.teamName);
  const [email, setEmail] = useState(currentUser.email);
  const [isAdmin, setIsAdmin] = useState(currentUser.isAdmin);
  const [userPasswordInput, setUserPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!isOpen) return null;

  const defaultAdminEmail = adminSettings.adminEmail || 'mlbirchall@yahoo.co.uk';
  const expectedAdminPassword = adminSettings.adminPassword || 'admin';

  // Check if this email is in registered user accounts
  const registeredAccounts = storage.getUserAccounts();
  const registeredMatch = registeredAccounts.find(
    (acc) => acc.email.toLowerCase() === email.trim().toLowerCase()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    const trimmedEmail = email.trim().toLowerCase();
    let verifiedAdmin = false;

    // Check if account is a registered user account with password
    if (registeredMatch) {
      if (userPasswordInput && userPasswordInput !== registeredMatch.password) {
        setPasswordError(`Incorrect password for registered account "${registeredMatch.email}".`);
        return;
      }
      if (registeredMatch.isAdmin) {
        verifiedAdmin = true;
      }
    }

    // If user claims admin role or enters the designated admin email
    if (isAdmin || trimmedEmail === defaultAdminEmail.toLowerCase()) {
      if (currentUser.isAdminAuthenticated && currentUser.email.toLowerCase() === defaultAdminEmail.toLowerCase()) {
        // Already authenticated in current session
        verifiedAdmin = true;
      } else if (userPasswordInput === expectedAdminPassword || (registeredMatch && registeredMatch.isAdmin && userPasswordInput === registeredMatch.password)) {
        // Correct password supplied
        verifiedAdmin = true;
      } else {
        // Wrong or missing password
        setPasswordError('Invalid Admin Password. Only the authorized administrator with the master password can access admin features.');
        return;
      }
    }

    onSaveUser({
      ...currentUser,
      name: name.trim() || (registeredMatch?.name ?? 'Predictor'),
      teamName: teamName.trim() || (registeredMatch?.teamName ?? 'My Fantasy XI'),
      email: trimmedEmail || 'user@example.com',
      isAdmin: verifiedAdmin,
      isAdminAuthenticated: verifiedAdmin,
    });
    onClose();
  };

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
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
            <input
              id="input-auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (e.target.value.trim().toLowerCase() === defaultAdminEmail.toLowerCase()) {
                  setIsAdmin(true);
                }
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            />
            {email.trim().toLowerCase() === defaultAdminEmail.toLowerCase() && (
              <span className="text-[10px] text-amber-400 font-semibold mt-1 block">
                ⭐ Default Admin Account Recognized ({defaultAdminEmail})
              </span>
            )}
          </div>

          {/* Password Section for Admin or Registered User Accounts */}
          {(isAdmin || registeredMatch) && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white">
                      {registeredMatch ? 'Account Password Required' : 'Administrator Access'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {registeredMatch
                        ? 'Enter your assigned password to sign into this registered predictor account'
                        : 'Manage categories, lock season, delete leagues & users'}
                    </div>
                  </div>
                </div>

                {!registeredMatch && (
                  <input
                    id="toggle-admin-role"
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => {
                      setIsAdmin(e.target.checked);
                      if (!e.target.checked) {
                        setPasswordError(null);
                      }
                    }}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                )}
              </div>

              {/* Password input */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5 animate-fade-in">
                <label className="block text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" />
                  {isAdmin ? 'Admin Master Password / PIN *' : 'Assigned User Password *'}
                </label>
                <input
                  id="input-user-password"
                  type="password"
                  required={isAdmin || Boolean(registeredMatch)}
                  placeholder="Enter password..."
                  value={userPasswordInput}
                  onChange={(e) => {
                    setUserPasswordInput(e.target.value);
                    setPasswordError(null);
                  }}
                  className="w-full bg-slate-900 border border-amber-600/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
                <p className="text-[10px] text-slate-400">
                  {isAdmin
                    ? 'Default admin password is "admin" (can be changed in the Admin Console).'
                    : 'Enter the password set by the administrator for this user.'}
                </p>
              </div>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-950/80 border border-rose-700/80 rounded-xl text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

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

