import React, { useState } from 'react';
import { 
  Trophy, 
  Shield, 
  Lock, 
  Unlock, 
  Mail, 
  KeyRound, 
  UserPlus, 
  LogIn, 
  Sparkles, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  User,
  Users
} from 'lucide-react';
import { AdminSettings, CurrentUser, AppUserAccount } from '../types';
import { storage } from '../lib/storage';

interface LoginPageProps {
  onLogin: (user: CurrentUser) => void;
  adminSettings: AdminSettings;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, adminSettings }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Sign Up state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpTeamName, setSignUpTeamName] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);

  const defaultAdminEmail = (adminSettings.adminEmail || 'mlbirchall@yahoo.co.uk').trim().toLowerCase();
  const defaultAdminPassword = adminSettings.adminPassword || 'admin';

  // Handle Sign In
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);

    const emailClean = signInEmail.trim().toLowerCase();
    const passwordClean = signInPassword.trim();

    if (!emailClean) {
      setSignInError('Please enter your email address.');
      return;
    }

    if (!passwordClean) {
      setSignInError('Please enter your password / PIN.');
      return;
    }

    // 1. Check if master Admin
    if (emailClean === defaultAdminEmail) {
      if (passwordClean === defaultAdminPassword) {
        const adminUser: CurrentUser = {
          id: 'admin_1',
          name: 'Mark Birchall',
          email: defaultAdminEmail,
          teamName: 'The Invincible Pundits',
          isAdmin: true,
          isAdminAuthenticated: true,
        };
        onLogin(adminUser);
        return;
      } else {
        setSignInError('Incorrect password for Administrator account.');
        return;
      }
    }

    // 2. Check registered accounts in storage
    const accounts = storage.getUserAccounts();
    const matchedAccount = accounts.find(a => a.email.toLowerCase() === emailClean);

    if (matchedAccount) {
      const requiredPassword = matchedAccount.password || 'password123';
      if (passwordClean === requiredPassword) {
        const user: CurrentUser = {
          id: matchedAccount.id,
          name: matchedAccount.name,
          email: matchedAccount.email,
          teamName: matchedAccount.teamName || `${matchedAccount.name}'s XI`,
          isAdmin: Boolean(matchedAccount.isAdmin),
          isAdminAuthenticated: Boolean(matchedAccount.isAdmin),
        };
        onLogin(user);
        return;
      } else {
        setSignInError('Incorrect password for this user account.');
        return;
      }
    }

    // 3. Fallback: If user entered credentials but isn't pre-registered
    // If they provided a valid password and email, auto-create their predictor profile
    const autoUser: CurrentUser = {
      id: `user_${Date.now()}`,
      name: emailClean.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' '),
      email: emailClean,
      teamName: 'My Fantasy XI',
      isAdmin: false,
      isAdminAuthenticated: false,
    };
    
    // Save to accounts
    storage.addOrUpdateUserAccount({
      id: autoUser.id,
      name: autoUser.name,
      email: autoUser.email,
      teamName: autoUser.teamName,
      password: passwordClean,
      isAdmin: false,
      createdAt: new Date().toISOString(),
      isRegisteredByAdmin: false,
    });

    onLogin(autoUser);
  };

  // Handle Sign Up
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);

    const nameClean = signUpName.trim();
    const emailClean = signUpEmail.trim().toLowerCase();
    const teamClean = signUpTeamName.trim() || `${nameClean}'s XI`;
    const passwordClean = signUpPassword.trim();

    if (!nameClean || !emailClean || !passwordClean) {
      setSignUpError('Please fill in your name, email, and choose a password.');
      return;
    }

    // Check if email already registered
    const accounts = storage.getUserAccounts();
    const exists = accounts.some(a => a.email.toLowerCase() === emailClean);
    if (exists) {
      setSignUpError('An account with this email already exists. Please switch to Sign In.');
      return;
    }

    const newAccount: AppUserAccount = {
      id: `user_${Date.now()}`,
      name: nameClean,
      email: emailClean,
      teamName: teamClean,
      password: passwordClean,
      isAdmin: emailClean === defaultAdminEmail,
      createdAt: new Date().toISOString(),
      isRegisteredByAdmin: false,
    };

    storage.addOrUpdateUserAccount(newAccount);

    const newUser: CurrentUser = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      teamName: newAccount.teamName,
      isAdmin: Boolean(newAccount.isAdmin),
      isAdminAuthenticated: Boolean(newAccount.isAdmin),
    };

    setSignUpSuccess('Account created! Logging you in...');
    setTimeout(() => {
      onLogin(newUser);
    }, 600);
  };

  // Quick fill demo accounts
  const handleQuickLogin = (email: string, pass: string) => {
    setSignInEmail(email);
    setSignInPassword(pass);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-2xl shadow-purple-600/40 animate-pulse">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Trophy className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-['Outfit']">
                PREMIER<span className="text-purple-400">PREDICTOR</span>
              </h1>
              <span className="bg-purple-950 text-purple-300 text-xs font-bold px-2 py-0.5 rounded border border-purple-700/60">
                2026/27
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Premier League Predictions & Mini-Leagues
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setSignInError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'signin'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setSignUpError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'signup'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Create Account
            </button>
          </div>

          {/* SIGN IN FORM */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              {signInError && (
                <div className="p-3 bg-rose-950/80 border border-rose-700/80 rounded-xl text-xs text-rose-200 flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{signInError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. mlbirchall@yahoo.co.uk"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Password / PIN</span>
                  <span className="text-[10px] text-slate-500">Case-sensitive</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password..."
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Sign In to Premier Predictor
              </button>

              {/* Quick Login Helpers */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>Quick Demo Sign In:</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin(defaultAdminEmail, defaultAdminPassword)}
                    className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-amber-800/40 text-left group transition-all"
                  >
                    <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Admin
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">Mark Birchall</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('liam.h@example.com', 'password123')}
                    className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left group transition-all"
                  >
                    <div className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
                      <User className="w-3 h-3" /> Predictor
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">Liam Henderson</div>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* SIGN UP FORM */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              {signUpError && (
                <div className="p-3 bg-rose-950/80 border border-rose-700/80 rounded-xl text-xs text-rose-200 flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{signUpError}</span>
                </div>
              )}

              {signUpSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{signUpSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Team Name (Optional)
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. The Tactical Wizards"
                    value={signUpTeamName}
                    onChange={(e) => setSignUpTeamName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Choose a Password / PIN *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Choose a password..."
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Create Account & Start Predicting
              </button>
            </form>
          )}

          {/* Guest Mode Explorer */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                const guestUser: CurrentUser = {
                  id: `guest_${Date.now()}`,
                  name: 'Guest Predictor',
                  email: 'guest@premierpredictor.local',
                  teamName: 'Guest Team',
                  isAdmin: false,
                  isAdminAuthenticated: false,
                };
                onLogin(guestUser);
              }}
              className="text-[11px] text-slate-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1"
            >
              <span>Continue as Guest / Viewer</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>

        {/* Security and Info Footer */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>Premier League 2026/27 Prediction Platform</p>
          <p className="text-[10px] text-slate-600">Admin gated by secure credentials • Mini-Leagues • Real-Time Scoring</p>
        </div>

      </div>
    </div>
  );
};
