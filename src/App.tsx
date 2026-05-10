/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Vote, 
  ShieldCheck, 
  Lock, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Eye, 
  LogOut,
  Database,
  Cpu,
  RefreshCw,
  LockKeyhole,
  Edit,
  Save,
  Plus,
  X,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  HelpCircle,
  History,
  MessageSquare,
  TrendingUp,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import './styles/global.scss';
import './styles/landing.scss';
import './styles/login.scss';
import './styles/results.scss';
import './styles/admin.scss';
import './styles/profile-explorer.scss';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type View = 'landing' | 'login' | 'register' | 'vote' | 'results' | 'admin' | 'explorer' | 'profile';
type Role = 'user' | 'candidate' | 'admin' | 'delegate';

interface AuthState {
  role: Role | null;
  user: { id: string, name: string, hasVoted?: boolean, photo?: string, region?: string, delegatePower?: number } | null;
}

interface Candidate {
  id: string;
  name: string;
  party: string;
  partyId: string;
  symbol: string;
  bio: string;
  platform: string[];
  photo: string;
  region: string;
  votes?: number;
}

interface Party {
  id: string;
  name: string;
  symbol: string;
}

interface AuditEntry {
  timestamp: string;
  action: string;
  details: string;
  level: 'info' | 'warning' | 'danger';
}

interface Block {
  index: number;
  timestamp: string;
  vote: { 
    voterId: string, 
    candidateId: string,
    region: string,
    weight: number 
  };
  previousHash: string;
  hash: string;
}

interface Notification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'info' | 'urgent' | 'success';
}

const PARTIES: Party[] = [
  { id: 'republican', name: 'Republican Party', symbol: '🐘' },
  { id: 'democrat', name: 'Democrat Party', symbol: '🐴' },
  { id: 'liberal', name: 'Liberal Party', symbol: '🗽' },
  { id: 'socialdem', name: 'Social Democrats Party', symbol: '🌹' },
  { id: 'communist', name: 'Communist Party', symbol: '⚒️' },
  { id: 'socialist', name: 'Socialist Party', symbol: '✊' },
  { id: 'leftist', name: 'Left Wing Party', symbol: '⬅️' },
  { id: 'rightist', name: 'Right Wing Party', symbol: '➡️' },
  { id: 'independent', name: 'Independent', symbol: '#' }
];

const REGIONS = ['Sector 1','Sector 2','Sector 3','Sector 2','Sector 4','Sector 5'];

const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#64748b'];

// --- Sub-Components ---

const SymbolRenderer = ({ symbol, className }: { symbol: string, className?: string }) => {
  const isUrl = symbol && (symbol.startsWith('http') || symbol.startsWith('https') || symbol.includes('.png') || symbol.includes('.jpg') || symbol.includes('.svg'));
  
  if (isUrl) {
    return <img src={symbol} className={cn("object-contain", className)} alt="Party Symbol" referrerPolicy="no-referrer" />;
  }
  
  return <span className={className}>{symbol}</span>;
};

const NotificationCenter = ({ notifications, onClose }: { notifications: Notification[], onClose: () => void }) => (
  <div className="fixed inset-0 z-[500] flex items-center justify-end p-6 pointer-events-none">
     <motion.div 
      initial={{ x: 100, opacity: 0 }} 
      animate={{ x: 0, opacity: 1 }} 
      exit={{ x: 100, opacity: 0 }}
      className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl pointer-events-auto border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
    >
       <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center">
                <Info className="w-5 h-5 text-emerald-500" />
             </div>
             <h3 className="text-xl font-black text-slate-900 tracking-tight">System Notifications</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
             <X className="w-5 h-5" />
          </button>
       </div>
       <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {notifications.map((n) => (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={n.id} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:border-emerald-500/30 transition-all">
                <div className="flex justify-between items-start mb-2">
                   <h4 className="font-black text-slate-950 uppercase text-[11px] tracking-widest">{n.title}</h4>
                   <span className={cn(
                      "text-[8px] font-black uppercase px-2 py-1 rounded-lg",
                      n.type === 'urgent' ? "bg-red-100 text-red-600" : n.type === 'success' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                   )}>{n.type}</span>
                </div>
                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-4">{n.message}</p>
                <p className="text-[10px] font-bold text-slate-300 font-mono italic">{new Date(n.timestamp).toLocaleTimeString()}</p>
             </motion.div>
          ))}
          {notifications.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
                <ShieldCheck className="w-16 h-16 mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">No active alerts</p>
             </div>
          )}
       </div>
    </motion.div>
  </div>
);

const LandingPage = ({ setView }: { setView: (v: View) => void }) => (
  <div className="landing-container">
    {/* Animated background elements */}
    <div className="landing-container__backdrop">
      <div className="landing-container__backdrop-blob landing-container__backdrop-blob--emerald" />
      <div className="landing-container__backdrop-blob landing-container__backdrop-blob--blue" />
      <div className="landing-container__backdrop-grid" />
    </div>

    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="landing-container__content"
    >
      {/* Header Section */}
      <div className="landing-header">
        <motion.div 
          initial={{ scale: 0.8, rotate: -12 }}
          animate={{ scale: 1, rotate: 12 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="landing-header__icon-wrapper"
        >
          <ShieldCheck />
        </motion.div>
        
        <h1 className="landing-header__title">
          Metropolis EVoting-2026
        </h1>
        
        <p className="landing-header__subtitle">
          Independent System • Protocol 2026
        </p>
      </div>

      {/* Action Buttons */}
      <div className="landing-buttons">
        <button 
          onClick={() => setView('login')} 
          className="landing-buttons__button landing-buttons__button--primary"
        >
          Sign in / Sign up
        </button>
        <button 
          onClick={() => setView('results')} 
          className="landing-buttons__button landing-buttons__button--secondary"
        >
          Election Results
        </button>
      </div>
      
      {/* Footer Status */}
      <div className="landing-footer">
        <p className="landing-footer__status">
          <RefreshCw />
          Realtime Sync active
        </p>
        <div className="landing-footer__sync-dots">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="sync-dot" />)}
        </div>
      </div>
    </motion.div>
  </div>
);

const RegistrationSuccessView = ({ regSuccess, onContinue }: { regSuccess: { uid: string, psw: string }, onContinue: () => void }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0f172a] relative overflow-hidden pt-12">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
    
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }}
      className="max-w-md w-full bg-[#0A0A0F] border border-white/10 rounded-[2.5rem] p-1 shadow-2xl"
    >
      <div className="bg-[#0D0D14] rounded-[2.2rem] p-8 border border-white/5 relative overflow-hidden">
        <div className="flex flex-col items-center mb-8">
           <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-2xl">
              <ShieldCheck className="w-8 h-8 text-white" />
           </div>
           <h2 className="text-xl font-black text-white tracking-widest uppercase">Identity Verified</h2>
           <p className="text-[10px] font-black text-emerald-500 tracking-[0.4em] uppercase mt-1">Independent System Protocol 2026</p>
        </div>

        <div className="space-y-4 bg-white/5 rounded-3xl p-6 border border-white/5 mb-8">
           <div className="space-y-1">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Username</span>
              <div className="text-xl font-mono font-bold text-white tracking-widest">{regSuccess.uid}</div>
           </div>
           <div className="h-px bg-white/5" />
           <div className="space-y-1">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Password</span>
              <div className="text-xl font-mono font-bold text-emerald-500 tracking-widest">{regSuccess.psw}</div>
           </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8">
           <p className="text-[10px] font-bold text-amber-500 leading-relaxed uppercase text-center">
             Warning: Store these credentials immediately. They will not be displayed again.
           </p>
        </div>

        <button 
          onClick={onContinue}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl transition-all active:scale-95"
        >
          Proceed to Login
        </button>
      </div>
    </motion.div>
  </div>
);

const SystemAlert = ({ regSuccess, onClose }: { regSuccess: { uid: string, psw: string } | null, onClose: () => void }) => (
  <AnimatePresence>
    {regSuccess && (
      <motion.div 
        initial={{ y: -100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 z-[200] pointer-events-none"
      >
        <div className="max-w-md mx-auto bg-emerald-600 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between pointer-events-auto border border-white/20">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">Status: Provisioned</p>
              <p className="text-xs font-bold tracking-tight">Credentials ready for use.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const TopSecurityBar = ({ results, auth }: { results: any, auth: AuthState }) => {
  const isActive = results?.isVotingOpen ?? true;
  if (auth.role !== 'admin') {
    return (
      <div className="bg-slate-950 border-b border-white/5 h-8 px-6 flex items-center justify-between text-[10px] font-black tracking-[0.2em] uppercase z-[150] fixed top-0 left-0 right-0 text-white/40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isActive ? "bg-emerald-500" : "bg-amber-500")} />
            Protocol Status: {isActive ? "Live" : "Standby"}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="opacity-50">Evoting v2.0.6</span>
        </div>
      </div>
    );
  }
  return (
    <div className={cn(
      "bg-slate-950 border-b border-white/5 h-8 px-6 flex items-center justify-between text-[10px] font-black tracking-[0.2em] uppercase z-[150] fixed top-0 left-0 right-0",
      isActive ? "text-emerald-500" : "text-amber-500"
    )}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isActive ? "bg-emerald-500" : "bg-amber-500")} />
          {isActive ? "Election Protocol: Active" : "Election Protocol: Suspended"}
        </div>
        <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-4 text-white/40">
          <Database className="w-3 h-3" />
          Registry: Mainnet_Secure
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 text-white/40">
          <Cpu className="w-3 h-3" />
          Block_Height: #{results?.totalVotes || 0}
        </div>
        <span className="text-white/20">v2.0.6-PROD</span>
      </div>
    </div>
  );
};

const TopBar = ({ auth, handleLogout, setView, setShowNotifications, notifications = [], results }: { auth: AuthState, handleLogout: () => void, setView: (v: View) => void, setShowNotifications: (v: boolean) => void, notifications: any[], results: any }) => (
  <nav className="sticky top-8 z-[100] bg-slate-950/80 backdrop-blur-3xl border-b border-white/5 px-6 md:px-12 py-4 flex items-center justify-between">
    <div className="flex items-center gap-6">
       <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
          <ShieldCheck className="w-7 h-7 text-slate-950" />
       </div>
       <button onClick={() => setView('landing')} className="text-left">
          <span className="text-2xl font-black text-white tracking-tighter block leading-none">EVoting</span>
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.4em] mt-1 block">EVoting 2026 Protocol</span>
       </button>
    </div>
    <div className="flex items-center gap-4 md:gap-6">
      <button 
        onClick={() => setView('about')}
        className="px-4 py-2 text-white/40 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all"
      >
        About
      </button>

      {(auth.role === 'admin' || results?.isResultsPublished) && (
        <button 
          onClick={() => setView('results')}
          className="hidden md:flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-xl hover:shadow-emerald-500/20"
        >
          <Database className="w-4 h-4" />
          Live Results
        </button>
      )}

      {auth.user ? (
        <>
          <button 
            onClick={() => setShowNotifications?.(true)}
            className="relative p-4 rounded-2xl bg-white/5 text-white/40 hover:bg-white/10 transition-all"
          >
            <Info className="w-5 h-5" />
            {notifications && notifications.length > 0 && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
            )}
          </button>
          <button 
            onClick={() => setView(auth.role === 'admin' ? 'admin-profile' : 'profile')}
            className="flex items-center gap-4 p-2 pr-4 md:pr-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <img 
              src={auth.user?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.user?.name}`} 
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10" 
              referrerPolicy="no-referrer"
            />
            <div className="hidden sm:flex flex-col items-start leading-none gap-1">
              <span className="text-xs font-black text-white tracking-tight">{auth.user?.name}</span>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">{auth.role}</span>
            </div>
          </button>
          <button 
            onClick={handleLogout} 
            className="p-4 rounded-2xl bg-white/5 text-white/40 hover:bg-red-500 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </>
      ) : (
        <button 
          onClick={() => setView('login')}
          className="px-8 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10"
        >
          Login Gateway
        </button>
      )}
    </div>
</nav>
);

const CandidateModal = ({ candidate, onClose, auth }: { candidate: Candidate, onClose: () => void, auth: AuthState }) => {
  const isAdmin = auth.role === 'admin';
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 backdrop-blur-2xl bg-black/60">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-xl w-full bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto">
         <div className="relative h-48 md:h-64 bg-slate-50 flex items-center justify-center overflow-hidden">
            {isAdmin ? (
               <img src={candidate.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.name}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
               <div className="p-12 w-full h-full flex items-center justify-center">
                  <SymbolRenderer symbol={candidate.symbol} className="w-24 h-24 opacity-20" />
               </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            <button onClick={onClose} className="absolute top-4 md:top-6 right-4 md:right-6 p-2 md:p-3 bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl hover:bg-white/40 transition-all text-slate-900 border border-slate-200">
               <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
         </div>
         <div className="p-6 md:p-10 -mt-12 md:-mt-20 relative">
            <div className="flex items-start justify-between mb-4 md:mb-6">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <SymbolRenderer symbol={candidate.symbol} className="w-6 h-6 text-lg" />
                     <span className="inline-block px-3 md:px-4 py-1 bg-slate-900 text-white text-[8px] md:text-[10px] font-black uppercase rounded-full tracking-widest">{candidate.party}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">{candidate.name}</h2>
               </div>
            </div>
            
            {isAdmin ? (
              <div className="space-y-6">
                 <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                    <div className="flex items-center gap-4 text-emerald-900 mb-2">
                       <ShieldCheck className="w-5 h-5" />
                       <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Administrative View Active</span>
                    </div>
                    <p className="text-emerald-800/70 text-[10px] font-bold">You are viewing restricted biometric data and internal biographies.</p>
                 </div>
                 <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrative Biography (Internal)</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{candidate.bio}</p>
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Results Platform</h4>
                    <ul className="space-y-2">
                       {candidate.platform.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-600">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                             {point}
                          </li>
                       ))}
                    </ul>
                 </div>
              </div>
            ) : (
              <div className="space-y-6">
                 <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <div className="flex items-center gap-4 text-slate-900 mb-2">
                       <Lock className="w-5 h-5 text-slate-400" />
                       <span className="text-xs font-black uppercase tracking-widest">Identity Encrypted</span>
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold">Biometric photos and detailed biographies are restricted to election website administrators.</p>
                 </div>
                 <div className="p-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-center">
                    <ShieldCheck className="w-8 h-8 text-emerald-500/20 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Formal Verification Sync Complete</p>
                    <p className="text-[9px] text-slate-300 mt-1 uppercase">Candidate data active on EVoting System 2026.</p>
                 </div>
              </div>
            )}
  
            <button onClick={onClose} className="w-full mt-10 bg-slate-900 text-white py-4 rounded-[1.5rem] font-black text-base hover:bg-slate-800 transition-all">Synchronize Exit</button>
         </div>
      </motion.div>
    </div>
  );
};

const VoteConfirmationModal = ({ voteData, onClose }: { voteData: any, onClose: () => void }) => {
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#020617']
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white rounded-[3rem] max-w-md w-full p-12 text-center shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/20"
      >
        <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-[0_20px_50px_-10px_rgba(16,185,129,0.5)]">
           <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-4xl font-black text-slate-950 tracking-tight mb-4">Vote Recorded</h2>
        <p className="text-slate-500 font-medium mb-12">Your decision has been immutable synchronized with the EVoting System 2026.</p>
        
        <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 mb-10">
           <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100 mb-2">
                 <SymbolRenderer symbol={voteData.symbol} className="w-8 h-8" />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">{voteData.party}</p>
              <h4 className="text-2xl font-black text-slate-950 tracking-tight">{voteData.candidateName}</h4>
           </div>
        </div>

        <button 
          onClick={onClose} 
          className="w-full bg-slate-950 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-950/20"
        >
          Return to Website
        </button>
      </motion.div>
    </div>
  );
};

const AboutPage = ({ setView, auth, handleLogout, notifications, setShowNotifications, results }: any) => (
  <div className="min-h-screen bg-[#0f172a] text-white font-sans pb-24 relative overflow-hidden pt-12">
    <TopBar auth={auth} handleLogout={handleLogout} setView={setView} notifications={notifications} setShowNotifications={setShowNotifications} results={results} />
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 relative z-10 space-y-12">
      {/* Hero & History Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0A0A0F]/80 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 md:p-16 shadow-2xl">
        <h2 className="text-4xl md:text-8xl font-black tracking-tighter mb-12 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">Metropolis City: The Future of Sovereignty</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h3 className="text-xl font-black text-emerald-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                <History className="w-6 h-6" /> City Origin
              </h3>
              <div className="text-white/70 leading-relaxed space-y-4 text-lg">
                <p>Founded in 2000 as a tech-hub experiment, Metropolis City has grown into a sovereign Smart-City enclave. The architecture is a blend of neo-futurism and high-density living, powered entirely by renewable energy.</p>
                <p>The population is approximately 3 million, with a diverse demographic and a strong emphasis on civic engagement and technological innovation. Founded by Robert Langdon, the city maintains an ethos of transparency and sustainability.</p>
                <p>Divided into 5 sectors, Metropolis is renowned for its advanced public transportation system, vertical farming, and GDP estimated at $50 billion.</p>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-black text-emerald-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6" /> Executive Leadership
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Robert Langdon', party: 'DEMOCRAT', years: '2000-2012', desc: 'Founder & Visionary' },
                  { name: 'Elena Rodriguez', party: 'REPUBLICAN', years: '2012-2018', desc: 'Energy Transition' },
                  { name: 'Marcus Lee', party: 'SOCIAL DEMOCRAT', years: '2018-2024', desc: 'EVoting Pioneer' },
                  { name: 'Alen Richurd', party: 'SOCIAL DEMOCRAT', years: '2024-Present', desc: 'Transition Authority' },
                ].map((m, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                    <div className="font-black text-white">{m.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-emerald-500 mb-2">{m.party} • {m.years}</div>
                    <div className="text-xs text-white/40 leading-none">{m.desc}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-8">
              <h3 className="text-xl font-black text-white uppercase tracking-widest mb-4">Quick Stats</h3>
              <div className="space-y-4">
                {[
                  { label: 'Founded', val: '2000' },
                  { label: 'Population', val: '3.1M' },
                  { label: 'GDP', val: '$50B' },
                  { label: 'Energy', val: '100% Green' },
                ].map((s, i) => (
                  <div key={i} className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/40 text-[10px] font-bold uppercase">{s.label}</span>
                    <span className="text-emerald-500 font-black">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-[2rem] p-8">
              <h3 className="text-xl font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" /> MCEC History
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Established in 2000, the Metropolis City Election Commission (MCEC) pioneered Alpha-Chain 2.0. Our registry is fully immutable, decentralized, and audited by sovereign nodes.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sector Information Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="bg-[#0A0A0F]/80 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 md:p-16 shadow-2xl"
      >
        <div className="mb-12">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter">Sovereign Sector Grid</h2>
          <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Economic & Demographic Distribution</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 1, name: 'Sector 1: Central Core', pop: '750k', gdp: '$15.2B', focus: 'Financial & Governance Hub' },
            { id: 2, name: 'Sector 2: Neon Heights', pop: '600k', gdp: '$10.5B', focus: 'Technological R&D' },
            { id: 3, name: 'Sector 3: Harbor District', pop: '900k', gdp: '$12.8B', focus: 'Logistics & Global Trade' },
            { id: 4, name: 'Sector 4: Zen Garden', pop: '450k', gdp: '$6.5B', focus: 'Residential & Wellness' },
            { id: 5, name: 'Sector 5: Industrial Belt', pop: '300k', gdp: '$5.0B', focus: 'Manufacturing & Energy' },
          ].map((s) => (
            <div key={s.id} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:border-emerald-500/30 transition-all group">
              <div className="flex items-center justify-between mb-6">
                 <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                    <MapPin className="w-6 h-6 text-emerald-500" />
                 </div>
                 <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Region 0{s.id}</span>
              </div>
              <h4 className="text-xl font-black mb-6 group-hover:text-emerald-500 transition-colors">{s.name}</h4>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
                       <Users className="w-3 h-3" /> Population
                    </div>
                    <span className="font-mono font-bold text-white">{s.pop}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/40 text-[10px] font-black uppercase tracking-widest">
                       <TrendingUp className="w-3 h-3" /> Sector GDP
                    </div>
                    <span className="font-mono font-bold text-emerald-500">{s.gdp}</span>
                 </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/5">
                 <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Primary mandate</p>
                 <p className="text-sm font-medium text-white/60">{s.focus}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Contacts Section */}
      <div className="bg-[#0A0A0F]/80 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 md:p-16 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter">City Hub & Emergency</h2>
            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Official Government Directories</p>
          </div>
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4">
            <AlertTriangle className="text-red-500 w-6 h-6" />
            <div>
              <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">Emergency Dispatch</p>
              <p className="text-xl font-black">DIAL: 911-METRO</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { dept: 'Police Station', ph: '+1-555-911-00', mail: 'police@metropolis.gov', icon: ShieldCheck },
            { dept: 'Metro Hospital', ph: '+1-555-MED-99', mail: 'hospital@metropolis.gov', icon: HelpCircle },
            { dept: 'Fire Fighter Dept', ph: '+1-555-FIRE-88', mail: 'fire@metropolis.gov', icon: AlertTriangle },
            { dept: 'Disaster Management', ph: '+1-555-HELP-77', mail: 'emergency@metropolis.gov', icon: MapPin },
            { dept: 'City Council', ph: '+1-555-CNCL-66', mail: 'council@metropolis.gov', icon: Database },
            { dept: 'Mayor Office', ph: '+1-555-EXCT-55', mail: 'mayor@metropolis.gov', icon: User },
            { dept: 'Health Care Hub', ph: '+1-555-HLTH-44', mail: 'health@metropolis.gov', icon: CheckCircle2 },
            { dept: 'Public Transport', ph: '+1-555-MOVE-33', mail: 'transport@metropolis.gov', icon: RefreshCw },
          ].map((c, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all group">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <c.icon className="w-6 h-6 text-emerald-500" />
              </div>
              <h4 className="text-xl font-black mb-4 leading-tight">{c.dept}</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/40 text-sm font-mono"><Phone className="w-3 h-3" /> {c.ph}</div>
                <div className="flex items-center gap-2 text-white/40 text-sm font-mono"><Mail className="w-3 h-3" /> {c.mail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-[#0A0A0F]/80 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 md:p-16 shadow-2xl">
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-12">Registry FAQ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { q: "How do I cast my vote?", a: "Login with your unique Index ID and Access Key, select your delegate, and confirm. Your vote is then sealed in an Alpha-Chain block." },
            { q: "Is my vote really anonymous?", a: "Yes. Biometric data is decoupled from the vote block using SHA-256 hashing. Participation is public; selection is private." },
            { q: "What if I lose my credentials?", a: "Access keys are unique and immutable. If lost, visit a physical Verification Node in Sector 1 for biometric re-provisioning." },
            { q: "Can I change my vote?", a: "No. Under sovereign protocol 2.0, once a block is hashed and verified by the network, it is permanent." }
          ].map((faq, i) => (
            <div key={i} className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem]">
              <h4 className="text-lg font-black text-emerald-500 mb-4 flex items-start gap-3">
                <span className="w-6 h-6 bg-emerald-500 text-slate-950 flex items-center justify-center rounded-lg text-[10px] shrink-0">Q</span>
                {faq.q}
              </h4>
              <p className="text-white/60 leading-relaxed text-sm ml-9">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-[#0A0A0F]/80 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 md:p-16 shadow-2xl">
        <h3 className="text-xl font-black text-emerald-500 uppercase tracking-[0.3em] mb-8">Metropolis Jurisdiction Map</h3>
        <div className="aspect-video bg-slate-950 border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden relative group">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <MapPin className="w-16 h-16 text-emerald-500/20 mb-4 animate-bounce" />
          <span className="text-white/20 font-black uppercase tracking-widest text-center px-6">
            Sovereign Enclave Coordinates: 40.7128° N, 74.0060° W<br/>
            [ Map Layer Provision Active ]
          </span>
        </div>
      </div>
    </div>
  </div>
);

const HelpCenterPage = ({ setView, auth, handleLogout, notifications, setShowNotifications, results }: any) => (
  <div className="min-h-screen bg-[#0f172a] text-white font-sans pb-24 relative overflow-hidden pt-12">
    <TopBar auth={auth} handleLogout={handleLogout} setView={setView} notifications={notifications} setShowNotifications={setShowNotifications} results={results} />
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0A0A0F]/80 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 md:p-16 shadow-2xl">
        <div className="flex items-center gap-6 mb-12">
           <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center">
              <HelpCircle className="w-8 h-8 text-white" />
           </div>
           <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Help Center</h2>
        </div>
        <div className="space-y-8">
           {[
             { q: "How do I cast my vote?", a: "Once logged in, navigate to the 'Vote' section, select your preferred delegate, and click 'Confirm Vote'." },
             { q: "Is my vote really anonymous?", a: "Yes. The participation is recorded, but your specific choice is separated from your identity using cryptographic hashing." },
             { q: "What if I lose my credentials?", a: "Identity Access Keys are immutable. You must visit a physical Verification Node for identity re-provisioning." }
           ].map((faq, i) => (
             <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all">
                <h4 className="text-lg font-black text-emerald-500 mb-2">Q: {faq.q}</h4>
                <p className="text-white/60 leading-relaxed">A: {faq.a}</p>
             </div>
           ))}
        </div>
      </motion.div>
    </div>
  </div>
);

const ContactPage = ({ setView, auth, handleLogout, notifications, setShowNotifications, results }: any) => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setStatus('success');
        setForm({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans pb-24 relative overflow-hidden pt-12">
      <TopBar auth={auth} handleLogout={handleLogout} setView={setView} notifications={notifications} setShowNotifications={setShowNotifications} results={results} />
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0A0A0F]/80 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 md:p-16 shadow-2xl">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-12">Contact Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
           <div className="space-y-8">
              <div className="flex items-start gap-6">
                 <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"><Phone className="w-6 h-6 text-emerald-500" /></div>
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Phone Numbers</h4>
                    <p className="text-lg font-bold">+1 (202) 555-0126</p>
                 </div>
              </div>
              <div className="flex items-start gap-6">
                 <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl"><Mail className="w-6 h-6 text-blue-500" /></div>
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Email Support</h4>
                    <p className="text-lg font-bold">support@metropolis-mcec.gov</p>
                 </div>
              </div>
              <div className="flex items-start gap-6">
                 <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl"><MapPin className="w-6 h-6 text-purple-500" /></div>
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Head Office</h4>
                    <p className="text-lg font-bold leading-tight">Nexus Center, Floor 88<br/>Metropolis Core, Sector 1</p>
                 </div>
              </div>
           </div>
           <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden p-1 text-center">
              <div className="bg-slate-950/50 w-full h-full rounded-[1.8rem] flex items-center justify-center p-8">
                <div>
                   <MapPin className="w-12 h-12 text-white/20 mx-auto mb-4" />
                   <p className="text-xs font-black uppercase tracking-widest text-white/30">Google Maps Integration<br/>[ Sector 1 Core Location ]</p>
                </div>
              </div>
           </div>
        </div>

        <div className="border-t border-white/5 pt-12">
          <h3 className="text-2xl font-black mb-8">Send Feedback</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Your Name</label>
                <input 
                  required
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:bg-white/10 focus:border-emerald-500/50 transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email Address</label>
                <input 
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:bg-white/10 focus:border-emerald-500/50 transition-all" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Subject</label>
              <input 
                required
                value={form.subject}
                onChange={e => setForm({...form, subject: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none focus:bg-white/10 focus:border-emerald-500/50 transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Message</label>
              <textarea 
                required
                value={form.message}
                onChange={e => setForm({...form, message: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 h-32 font-medium text-white outline-none focus:bg-white/10 focus:border-emerald-500/50 transition-all resize-none" 
              />
            </div>
            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="w-full py-5 bg-emerald-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {status === 'loading' ? <RefreshCw className="animate-spin w-4 h-4 mx-auto" /> : "Transmit Message"}
            </button>
            {status === 'success' && <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest text-center">Message encrypted and sent to Central Authority Hub.</p>}
            {status === 'error' && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">Transmission failure. Central node unreachable.</p>}
          </form>
        </div>
      </motion.div>
    </div>
  </div>
  );
};

const AdminProfilePage = ({ auth, setView, handleLogout, notifications, setShowNotifications, results }: any) => {
  if (auth.role !== 'admin') return null;
  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans pb-24 relative overflow-hidden pt-12">
      <TopBar auth={auth} handleLogout={handleLogout} setView={setView} notifications={notifications} setShowNotifications={setShowNotifications} results={results} />
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-24 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0A0A0F]/80 backdrop-blur-3xl rounded-[3rem] border border-emerald-500/30 p-10 md:p-16 shadow-[0_0_50px_-10px_rgba(16,185,129,0.2)]">
          <div className="flex flex-col md:flex-row items-center gap-10 mb-16 pb-16 border-b border-white/5">
             <div className="w-40 h-40 rounded-[2.5rem] bg-emerald-500 flex items-center justify-center shadow-2xl border-8 border-slate-950">
                <ShieldCheck className="w-20 h-20 text-slate-950" />
             </div>
             <div className="text-center md:text-left">
                <span className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest mb-4 inline-block">System Authority</span>
                <h2 className="text-5xl font-black tracking-tighter mb-2">{auth.user?.name}</h2>
                <p className="font-mono text-emerald-500/60 text-sm tracking-widest">ID: {auth.user?.id}</p>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem]">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2"><Lock className="w-3 h-3" /> Security Access</h4>
                <ul className="space-y-4">
                   <li className="flex justify-between items-center"><span className="text-sm font-medium">Access Level</span> <span className="text-xs font-black text-emerald-500">ULTRA-PRIORITY</span></li>
                   <li className="flex justify-between items-center"><span className="text-sm font-medium">Consensus Control</span> <span className="text-xs font-black text-emerald-500">ENABLED</span></li>
                </ul>
             </div>
             <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem]">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2"><RefreshCw className="w-3 h-3" /> System Status</h4>
                <ul className="space-y-4">
                   <li className="flex justify-between items-center"><span className="text-sm font-medium">Node Sync</span> <span className="text-xs font-black text-emerald-500">ACTIVE</span></li>
                   <li className="flex justify-between items-center"><span className="text-sm font-medium">Protocol</span> <span className="text-xs font-black">SECURE_v2.0</span></li>
                </ul>
             </div>
          </div>
          <div className="mt-16 text-center">
             <button onClick={() => setView('admin')} className="px-12 py-5 bg-emerald-500 text-slate-950 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95">Enter Authority Hub</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const Footer = ({ setView }: { setView: (v: View) => void }) => (
  <footer className="bg-[#020205] border-t border-white/5 py-12 px-6">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
      <div className="flex items-center gap-4">
        <ShieldCheck className="w-6 h-6 text-emerald-500" />
        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Election Metropolis © 2026</span>
      </div>
      <div className="flex gap-10">
        <button onClick={() => setView('help')} className="text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all">Help Center</button>
        <button onClick={() => setView('contact')} className="text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all">Contact Us</button>
      </div>
    </div>
  </footer>
);

const ProfilePage = ({ auth, setAuth, setView, setLoading, handleLogout, results, notifications, setShowNotifications }: any) => {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [success, setSuccess] = useState(false);

  const hasVoted = results?.hasVoted;

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${auth.user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData(data);
      }
    } catch (e) {}
  }, [auth.user?.id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${auth.user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setAuth((prev: any) => ({ ...prev, user: { ...prev.user, name: data.name, photo: data.photo } }));
        setEditing(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } finally { setLoading(false); }
  };

  if (!profile) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><RefreshCw className="animate-spin text-emerald-500 w-12 h-12" /></div>;

  return (
    <div className="min-h-screen bg-[#0f172a] font-sans text-white relative overflow-hidden">
      <TopBar auth={auth} handleLogout={handleLogout} setView={setView} notifications={notifications} setShowNotifications={setShowNotifications} results={results} />
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0A0A0F]/80 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden">
          <div className="h-32 md:h-48 bg-slate-950 relative">
             <div className="absolute -bottom-16 left-10">
                <img src={profile.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] object-cover ring-8 ring-[#0A0A0F] shadow-2xl" />
             </div>
          </div>
          <div className="pt-20 pb-12 px-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
               <div className="flex items-center gap-6">
                  <div className="relative">
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">{profile.name}</h2>
                    {hasVoted && (
                      <div className="absolute -top-4 -right-12 bg-emerald-500 text-white p-1 rounded-full shadow-lg flex items-center justify-center border-4 border-[#0A0A0F]">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  {hasVoted && (
                    <span className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase rounded-xl tracking-widest flex items-center gap-2">
                       <CheckCircle2 className="w-3 h-3" />
                       Result Verified
                    </span>
                  )}
               </div>
               <div className="flex gap-4">
                  <button 
                     onClick={() => setView('vote')} 
                     className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 hover:bg-white/10"
                  >
                     <LogOut className="w-4 h-4 rotate-180" />
                     Back to Vote
                  </button>
                  <button 
                     onClick={() => setEditing(!editing)} 
                     className={cn("px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2", editing ? "bg-white/10 text-white/50" : "bg-emerald-500 text-slate-950")}
                  >
                     {editing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                     {editing ? "Cancel Changes" : "Modify Credentials"}
                  </button>
               </div>
            </div>

            <form onSubmit={onUpdate} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { key: 'name', label: 'Full Legal Name' },
                    { key: 'email', label: 'Registered Email' },
                    { key: 'phone', label: 'Secure Phone' },
                    { key: 'photo', label: 'Biometric Photo URL' }
                  ].map(f => (
                    <div key={f.key} className="space-y-2">
                       <label className="text-[10px] font-black text-white/60 uppercase tracking-widest ml-1">{f.label}</label>
                       <input 
                         disabled={!editing} 
                         value={formData[f.key] || ''} 
                         onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} 
                         className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white focus:bg-white/10 focus:border-emerald-500/50 transition-all disabled:opacity-60 outline-none" 
                       />
                    </div>
                  ))}
                  <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Physical Station Address</label>
                     <textarea 
                       disabled={!editing} 
                       value={formData.address || ''} 
                       onChange={e => setFormData({ ...formData, address: e.target.value })} 
                       className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 h-24 font-bold text-white focus:bg-white/10 focus:border-emerald-500/50 transition-all resize-none disabled:opacity-60 outline-none" 
                     />
                  </div>
               </div>

               {editing && (
                 <motion.button 
                   initial={{ opacity: 0, scale: 0.9 }} 
                   animate={{ opacity: 1, scale: 1 }} 
                   className="w-full bg-emerald-500 text-slate-950 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20"
                 >
                   Publish Updates
                 </motion.button>
               )}
            </form>

            <AnimatePresence>
               {success && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl text-center font-black text-[10px] uppercase tracking-widest border border-emerald-500/20">
                    Profile synchronized with sovereign registry.
                 </motion.div>
               )}
            </AnimatePresence>

            <div className="mt-12 pt-12 border-t border-white/5">
               <div className="bg-white/5 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 border border-white/10">
                        <Database className="w-8 h-8" />
                     </div>
                     <div>
                        <h4 className="text-xl font-black text-white tracking-tight">Identity Persistence</h4>
                        <p className="text-xs font-medium text-white/40">Formally registered since 2026.</p>
                     </div>
                  </div>
                  <button onClick={() => setView('explorer')} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 transition-all">Audit Chain Record</button>
               </div>
            </div>
          </div>
        </motion.div>
        <div className="mt-12 flex justify-center">
           <button onClick={() => setView('login')} className="text-white/30 hover:text-white text-xs font-black uppercase tracking-[0.3em] transition-all underline underline-offset-8 decoration-emerald-500/30">Session Exit</button>
        </div>
      </div>
    </div>
  );
};

const LoginPage = ({ setView, setAuth, setLoading, setError, setWarning, loading, error, warning, results }: any) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password })
      });
      const data = await res.json();
      if (res.ok) {
        setAuth({ role: data.role, user: data.user });
        if (data.role === 'admin') setView('admin');
        else setView(data.user.hasVoted ? 'results' : 'vote');
      } else {
        setError(data.error);
        if (data.warning) setWarning(data.warning);
      }
    } catch (err) {
      setError('Connection failed. Central server identity gateway offline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-container__backdrop">
        <div className="login-container__backdrop-blob login-container__backdrop-blob--emerald" />
        <div className="login-container__backdrop-blob login-container__backdrop-blob--blue" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="login-container__content"
      >
        <div className="login-card">
          <div className="login-card__header">
            <motion.div
              initial={{ scale: 0.8, rotate: -12 }}
              animate={{ scale: 1, rotate: 12 }}
              transition={{ type: "spring", stiffness: 100 }}
              style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #10b981, #6ee7b7)',
                borderRadius: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
                margin: '0 auto 1rem'
              }}
            >
              <ShieldCheck style={{ width: '40px', height: '40px', color: '#0f172a', transform: 'rotate(-12deg)' }} />
            </motion.div>
            <h2>Secure Election Gateway 1.0</h2>
            <p>Distributed Identity Verification System</p>
          </div>

          <form onSubmit={onSubmit} className="login-form">
            <div className="login-card__field">
              <label>Verified Index ID</label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(255,255,255,0.3)', opacity: 0.5 }} />
                <input 
                  type="text" 
                  value={userId} 
                  onChange={(e) => setUserId(e.target.value)} 
                  placeholder="Enter your user ID"
                  required 
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
            </div>

            <div className="login-card__field">
              <label>Identity Access Key</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(255,255,255,0.3)', opacity: 0.5 }} />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••••"
                  required
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="login-card__error"
                  style={{ display: 'flex', gap: '0.5rem' }}
                >
                  <AlertTriangle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                  <span>{error}</span>
                </motion.div>
              )}
              {warning && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="login-card__warning"
                  style={{ display: 'flex', gap: '0.5rem' }}
                >
                  <Info style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                  <span>{warning}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={loading} 
              className="login-card__button"
            >
              {loading ? <RefreshCw style={{ animation: 'rotate-spin 2s linear infinite' }} /> : "Verify Identity"}
            </button>
          </form>

          <div className="login-card__footer">
            <p>
              New to the platform? <a onClick={() => setView('register')}>Create new identity</a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const RegisterPage = ({ setRegSuccess, setView, setLoading, loading, error, setError, regSuccess }: any) => {
  const [regPath, setRegPath] = useState<'selection' | 'voter' | 'delegate'>('selection');
  const [formData, setFormData] = useState({
    fullName: '', email: '', dob: '', phone: '', address: '', verificationId: '',
    role: 'user' as Role, partyId: 'independent', partyKey: '', photo: '', bio: '', missionStatement: '',
    region: REGIONS[0]
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setRegSuccess({ uid: data.userId, psw: data.password });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Registration gateway error.');
    } finally {
      setLoading(false);
    }
  };

  if (regSuccess) {
    return <RegistrationSuccessView regSuccess={regSuccess} onContinue={() => { setRegSuccess(null); setView('login'); }} />;
  }

  if (regPath === 'selection') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-white">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl w-full text-center">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">Register Account</h1>
            <p className="text-emerald-500 mb-16 text-[10px] tracking-[0.6em] uppercase font-black">Identity Protocol Expansion</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <button 
                 onClick={() => { setRegPath('voter'); setFormData({ ...formData, role: 'user' }); }}
                 className="group p-1 bg-white/5 rounded-[3rem] border border-white/10 hover:border-emerald-500/50 transition-all text-left overflow-hidden"
               >
                  <div className="bg-[#0A0A0F] rounded-[2.8rem] p-12 h-full flex flex-col items-start gap-8 transition-transform group-hover:scale-[0.99]">
                     <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)]">
                        <User className="w-10 h-10" />
                     </div>
                     <div>
                        <h3 className="text-4xl font-black mb-2">Citizen Voter</h3>
                        <p className="text-white/40 text-sm leading-relaxed">Standard membership for participation in Election decision-making and balloting.</p>
                     </div>
                     <span className="mt-auto text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 group-hover:text-emerald-500 transition-colors">Select Path <Plus className="w-3 h-3" /></span>
                  </div>
               </button>

               <button 
                 onClick={() => { setRegPath('delegate'); setFormData({ ...formData, role: 'delegate' }); }}
                 className="group p-1 bg-white/5 rounded-[3rem] border border-white/10 hover:border-emerald-500/50 transition-all text-left overflow-hidden"
               >
                  <div className="bg-[#0A0A0F] rounded-[2.8rem] p-12 h-full flex flex-col items-start gap-8 transition-transform group-hover:scale-[0.99]">
                     <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white border border-white/20">
                        <ShieldCheck className="w-10 h-10" />
                     </div>
                     <div>
                        <h3 className="text-4xl font-black mb-2">Candidate Delegate</h3>
                        <p className="text-white/40 text-sm leading-relaxed">Advanced registration for leadership delegates. Includes bio-verification and mission statement auditing.</p>
                     </div>
                     <span className="mt-auto text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 group-hover:text-white transition-colors">Select Path <Plus className="w-3 h-3" /></span>
                  </div>
               </button>
            </div>
            
            <button onClick={() => setView('login')} className="mt-20 text-white/40 hover:text-white font-black uppercase text-[10px] tracking-[0.5em] transition-all underline underline-offset-8">Return to Security Login</button>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] py-16 md:py-32 px-4 md:px-6 font-sans relative overflow-hidden">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-0 left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-8 md:mb-12">
          <button onClick={() => setRegPath('selection')} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-white"><LogOut className="w-5 h-5 rotate-180" /></button>
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter capitalize">{regPath} Enrollment</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mt-1">Registry Gateway Alpha-4</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-8 bg-[#0A0A0F]/80 backdrop-blur-3xl p-6 md:p-14 rounded-[3rem] md:rounded-[4rem] border border-white/10 shadow-2xl relative z-10">
          <div className="space-y-12">
            <div>
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-10 border-b border-white/5 pb-4">Personal Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { id: 'fullName', label: 'Full Legal Name' },
                  { id: 'email', label: 'Identity Email' },
                  { id: 'dob', label: 'Birth Registry Date', type: 'date' },
                  { id: 'phone', label: 'Communication Link' },
                  { id: 'verificationId', label: 'Citizen Social Index' },
                  { id: 'photo', label: 'Biometric Access URL (Optional)' }
                ].map((f) => (
                  <div key={f.id} className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-white/40 ml-2 tracking-widest">{f.label}</label>
                    <input 
                      required={f.id !== 'photo'} 
                      type={f.type || 'text'} 
                      value={(formData as any)[f.id]} 
                      onChange={e => setFormData({...formData, [f.id]: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 transition-all font-bold text-white focus:bg-white/10 focus:border-emerald-500/50 outline-none" 
                    />
                  </div>
                ))}
              </div>
            </div>

            {regPath === 'delegate' && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4 border-b border-white/5 pb-4">Delegate Sovereignty Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-white/40 ml-2 tracking-widest">Party Affiliation</label>
                      <select value={formData.partyId} onChange={e => setFormData({ ...formData, partyId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none">
                         {PARTIES.map(p => <option key={p.id} value={p.id}>{p.symbol} {p.name}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-white/40 ml-2 tracking-widest">Delegation Access Key</label>
                      <input required type="password" value={formData.partyKey} onChange={e => setFormData({ ...formData, partyKey: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none" placeholder="••••••••••••" />
                   </div>
                   <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] uppercase font-black text-white/40 ml-2 tracking-widest">Party Symbol (Emoji or URL)</label>
                      <input value={(formData as any).symbol || ''} onChange={e => setFormData({ ...formData, symbol: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-white outline-none" placeholder="🐘 or https://..." />
                   </div>
                   <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] uppercase font-black text-white/40 ml-2 tracking-widest">Full Historical Biography</label>
                      <textarea required value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 h-32 resize-none font-bold text-white outline-none" placeholder="Describe your service history and political trajectory..." />
                   </div>
                   <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] uppercase font-black text-white/40 ml-2 tracking-widest">Sovereign Mission Statement</label>
                      <textarea required value={formData.missionStatement} onChange={e => setFormData({ ...formData, missionStatement: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 h-24 resize-none font-bold text-white outline-none" placeholder="What is your primary protocol for the next term?" />
                   </div>
                </div>
              </motion.div>
            )}
            <div className="md:col-span-2 space-y-2">
               <label className="text-[10px] uppercase font-black text-white/40 ml-2 tracking-widest">Digital Station Address</label>
               <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 h-24 resize-none font-bold text-white outline-none" />
            </div>
          </div>
          
          {error && <p className="text-red-500 font-bold px-4 bg-red-500/10 py-3 rounded-xl border border-red-500/20 text-xs text-center uppercase tracking-widest">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-emerald-500 text-slate-950 rounded-[2rem] py-6 font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-4 text-sm shadow-xl shadow-emerald-500/20">
            {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : (regPath === 'delegate' ? 'Propose Delegate Identity' : 'Verify Citizen Node')}
          </button>
        </form>
      </div>
    </div>
  );
};

const VoteView = ({ candidates, results, fetchResults, auth, setAuth, setView, setLoading, loading, handleLogout, setSelectedCandidateModal, notifications, setShowNotifications }: any) => {
  const [votedId, setVotedId] = useState<string | null>(null);
  const [filterParty, setFilterParty] = useState<string | 'all'>('all');
  const [voteConfirmation, setVoteConfirmation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredCandidates = candidates.filter((c: any) => {
    if (filterParty === 'all') return true;
    if (c.partyId === filterParty) return true;
    return c.party.toLowerCase().includes(filterParty.toLowerCase());
  });

  const onVote = async (cid: string) => {
    setVotedId(cid);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: auth.user!.id, candidateId: cid })
      });
      const data = await res.json();
      if (res.ok) {
        const candidate = candidates.find((c: any) => c.id === cid);
        setVoteConfirmation({
          candidateName: candidate.name,
          party: candidate.party,
          symbol: candidate.symbol
        });
        setAuth((prev: any) => ({ ...prev, user: { ...prev.user, hasVoted: true } }));
        await fetchResults();
      } else {
        setError(data.error || 'Identity rejection on protocol layer.');
      }
    } catch (e) {
      setError('Network synchronization failure.');
    } finally {
      setLoading(false);
    }
  };

  if (auth.user?.hasVoted) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white font-sans pb-24 overflow-y-auto relative">
        {voteConfirmation && <VoteConfirmationModal voteData={voteConfirmation} onClose={() => setVoteConfirmation(null)} />}
        <TopBar auth={auth} handleLogout={handleLogout} setView={setView} notifications={notifications} setShowNotifications={setShowNotifications} results={results} />
        <div className="flex flex-col items-center justify-center p-12 text-center mt-24">
           <motion.div  
             initial={{ scale: 0.5, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="w-32 h-32 bg-emerald-100 rounded-[3rem] flex items-center justify-center mb-10 shadow-2xl shadow-emerald-500/10"
           >
              <CheckCircle2 className="w-16 h-16 text-emerald-600" />
           </motion.div>
           <h2 className="text-5xl font-black tracking-tighter mb-4 text-white">Identity Participation Sync Complete</h2>
           <p className="text-white/60 max-w-sm mb-12 font-medium">Your Vote has been recorded. Consensus results will be announced via public protocol.</p>
           <div className="flex flex-col md:flex-row gap-4">
              <button 
                onClick={() => setView('results')} 
                className="px-12 py-5 bg-emerald-500 text-slate-950 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
              >
                Monitor Public Results
              </button>
              <button 
                onClick={() => setView('profile')} 
                className="px-12 py-5 bg-white/5 border border-white/10 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all active:scale-95"
              >
                View Identity Record
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] font-sans pb-24 relative overflow-hidden">
      {voteConfirmation && <VoteConfirmationModal voteData={voteConfirmation} onClose={() => setVoteConfirmation(null)} />}
      <TopBar auth={auth} handleLogout={handleLogout} setView={setView} notifications={notifications} setShowNotifications={setShowNotifications} results={results} />
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="mb-12 text-center max-w-2xl mx-auto text-white">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">Cast Your Ballot</h2>
          <p className="text-white/40 text-sm md:text-base font-medium">Sovereign EVoting-2026 protocol active. Verification required.</p>
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 p-4 bg-red-100 text-red-700 rounded-2xl border border-red-200 flex items-center justify-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Party Filter Bar */}
        <div className="mb-12 flex flex-wrap justify-center gap-2">
          <button 
            onClick={() => setFilterParty('all')}
            className={cn(
              "px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border",
              filterParty === 'all' ? "bg-emerald-500 text-slate-950 border-emerald-500 shadow-lg" : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
            )} 
          >
            All Candidates
          </button>
          {PARTIES.map(p => (
            <button 
              key={p.id}
              onClick={() => setFilterParty(p.id)}
              className={cn(
                "px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border flex items-center gap-2",
                filterParty === p.id ? "bg-emerald-500 text-slate-950 border-emerald-500 shadow-lg" : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
              )}
            >
              <SymbolRenderer symbol={p.symbol} className="w-4 h-4" />
              {p.name}
            </button>
          ))}
        </div>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredCandidates.map((c: any) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={c.id} 
                whileHover={{ y: -8 }}  
                className="bg-[#0A0A0F] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl flex flex-col h-full hover:border-emerald-500/30 transition-all"
              >
                <div className="flex flex-col items-center gap-4 text-center mb-10">
                    <div className="relative group"> 
                       <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center ring-8 ring-slate-50 shadow-2xl mb-2 overflow-hidden p-4 group-hover:scale-105 transition-transform">
                          <SymbolRenderer symbol={c.symbol} className="w-full h-full" />
                       </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] leading-none">{c.party}</span>
                      </div>
                      <h3 className="text-3xl font-black text-white leading-tight tracking-tighter">{c.name}</h3>
                    </div>
                </div>
                <div className="flex flex-col gap-3 mt-auto">
                    <button onClick={() => onVote(c.id)} disabled={loading} className="py-5 rounded-2xl bg-white/5 text-white border border-white/10 font-black text-sm uppercase tracking-widest hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-500 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-50">
                      {loading && votedId === c.id ? <RefreshCw className="animate-spin w-4 h-4" /> : <Vote className="w-4 h-4" />}
                      Confirm Vote
                    </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        
        {filteredCandidates.length === 0 && (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Database className="w-10 h-10" />
            </div>
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No delegates found in this partition</p>
          </div>
        )}
      </div>
    </div>
  );
};

const VoterResultsView = ({ results, fetchResults, auth, setView, handleLogout, notifications, setShowNotifications }: any) => {
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (!results || !results.results) return <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RefreshCw style={{ animation: 'rotate-spin 2s linear infinite', color: '#10b981', width: '48px', height: '48px' }} /></div>;

  if (!results.isResultsPublished && auth.role !== 'admin') {
    return (
      <div className="results-container">
        <TopBar auth={auth} handleLogout={handleLogout} setView={setView} notifications={notifications} setShowNotifications={setShowNotifications} results={results} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 80px)', padding: '1.5rem', textAlign: 'center', color: 'white' }}>
          <div style={{ width: '96px', height: '96px', background: 'rgba(255,255,255,0.05)', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Lock style={{ width: '40px', height: '40px', color: '#10b981' }} />
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '1rem' }}>Outcome Pending Announcement</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '448px', marginBottom: '3rem' }}>The Election Commission has not yet officially announced the results. Please synchronize later.</p>
          <button onClick={() => setView('vote')} className="control-btn control-btn--success">Return to Voting Portal</button>
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="results-container__backdrop">
        <div className="results-container__backdrop-blob results-container__backdrop-blob--emerald" />
        <div className="results-container__backdrop-blob results-container__backdrop-blob--blue" />
      </div>

      <TopBar auth={auth} handleLogout={handleLogout} setView={setView} notifications={notifications} setShowNotifications={setShowNotifications} results={results} />

      <div className="results-container__content">
        <div style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <h2 className="results-title">Election Results: Consensus Achieved</h2>
              <button 
                onClick={() => fetchResults()} 
                className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-emerald-500 group"
                title="Refresh Results"
              >
                <RefreshCw className="w-5 h-5 group-active:rotate-180 transition-transform duration-500" />
              </button>
            </div>
            <p style={{ color: '#10b981', fontWeight: 900, fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0.5rem 0 0 0' }}>Universal Protocol Verification Complete</p>
          </div>
          <div className="result-card" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', padding: '1rem 2rem', textAlign: 'right', maxWidth: '280px' }}>
            <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '0.25rem' }}>Total Verified Votes</span>
            <span style={{ fontSize: '2.25rem', fontWeight: 900, color: 'white' }}>{results.totalVotes}</span>
          </div>
        </div>

        <div className="results-grid">
          {results.results.map((c: any) => {
            const pct = results.totalVotes > 0 ? (c.votes / results.totalVotes) * 100 : 0;
            return (
              <div key={c.id} className="result-card">
                <img src={c.photo} alt={c.name} className="result-card__photo" />
                <div className="result-card__info">
                  <h4 className="result-card__name">{c.name}</h4>
                  <span className="result-card__party">{c.party}</span>
                </div>
                <div className="result-card__votes">
                  <div className="result-card__votes-label">Verified Votes</div>
                  <div className="result-card__votes-number">{c.votes}</div>
                </div>
                <div className="result-card__bar">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${pct}%` }} 
                    transition={{ duration: 0.8 }}
                    className="result-card__bar-fill"
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem', textAlign: 'center' }}>{pct.toFixed(2)}% of Chain</p>
              </div>
            );
          })}
        </div>

        <div className="results-charts">
          <div className="results-charts__card">
            <h3>Vote Distribution</h3>
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={results.results} 
                    dataKey="votes" 
                    nameKey="name" 
                    cx="50%" cy="50%" innerRadius={100} outerRadius={140} paddingAngle={5}
                    label={{ fill: '#fff', fontSize: 10, fontWeight: 800 }}
                  >
                    {results.results.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    labelStyle={{ color: '#10b981', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#fff', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminView = ({ results, setResults, auditLog, setAuditLog, loading, setLoading, auth, setAuth, handleLogout, setView, candidates = [], fetchCandidates, fetchResults, stats, fetchStats, notifications, setShowNotifications }: any) => {
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  const [candidateForm, setCandidateForm] = useState<any>({});
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', type: 'info' as any });
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const securityAlerts = auditLog.filter((log: any) => log.level === 'danger' || log.level === 'warning').slice(0, 5);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcastForm)
      });
      if (res.ok) {
        setBroadcastSuccess(true);
        setBroadcastForm({ title: '', message: '', type: 'info' });
        setTimeout(() => setBroadcastSuccess(false), 3000);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const eventSource = new EventSource('/api/admin/audit-log/stream');
    eventSource.onmessage = (event) => {
      const entry = JSON.parse(event.data);
      setAuditLog((prev: any) => [entry, ...prev]);
    };
    return () => eventSource.close();
  }, [setAuditLog]);

  const resetElection = async () => {
    if (!window.confirm("CRITICAL WARNING: This will delete ALL votes and reset all user voting status. Users will NOT be deleted. Proceed?")) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reset-election', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'admin1232026' })
      });
      if (res.ok) {
        await fetchResults();
        await fetchStats();
        window.alert("Protocol Re-initialized. Board is now clear.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoting = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/toggle-voting', { method: 'POST' });
      const data = await res.json();
      setResults((prev: any) => prev ? { ...prev, isVotingOpen: data.isVotingOpen } : { isVotingOpen: data.isVotingOpen });
      await fetchResults();
    } finally { setLoading(false); }
  };

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishPassword, setPublishPassword] = useState('');
  const [publishError, setPublishError] = useState('');

  const toggleResultsPublication = async () => {
    if (!results?.isResultsPublished && !showPublishModal) {
      setShowPublishModal(true);
      return;
    }

    setLoading(true);
    setPublishError('');
    try {
      const res = await fetch(results?.isResultsPublished ? '/api/admin/unpublish-results' : '/api/admin/publish-results', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: publishPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults((prev: any) => prev ? { ...prev, isResultsPublished: data.isResultsPublished } : { isResultsPublished: data.isResultsPublished });
      await fetchResults();
      setShowPublishModal(false);
      setPublishPassword('');
    } catch (e: any) {
      setPublishError(e.message);
    } finally { setLoading(false); }
  };

  const onEditCandidate = (c: any) => {
    setEditingCandidate(c);
    setCandidateForm({ ...c });
  };

  const onSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/candidates/${editingCandidate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateForm)
      });
      if (res.ok) {
        await fetchCandidates();
        setEditingCandidate(null);
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] font-sans pb-24 relative overflow-hidden pt-12">
      <TopBar auth={auth} handleLogout={handleLogout} setView={setView} notifications={notifications} setShowNotifications={setShowNotifications} results={results} />
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8 border-b border-white/5 pb-12">
          <div><h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">Authority Hub</h2><p className="text-white/40 font-medium max-w-lg">Advanced protocol monitoring for Election EVoting-2026.</p></div>
          <div className="flex flex-col items-stretch gap-4 min-w-[320px]">
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-xl flex flex-col items-center gap-4">
               <button onClick={toggleVoting} className={cn("w-full px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all", results?.isVotingOpen ? "bg-red-600 text-white" : "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20")}>
                  {results?.isVotingOpen ? "Close Node Transmission" : "Open Node Transmission"}
               </button>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Circuit Status: {results?.isVotingOpen ? "Online" : "Terminated"}</span>
            </div>

            <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 border border-white/5">
               <button 
                 onClick={toggleResultsPublication} 
                 className={cn(
                   "w-full px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all",
                   results?.isResultsPublished ? "bg-white text-slate-950" : "bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/20"
                 )}
               >
                  {results?.isResultsPublished ? "Retract Outcomes" : "Announce Consensus"}
               </button>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Publication: {results?.isResultsPublished ? "Public Chain" : "Private Ledger"}</span>
            </div>

            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-lg flex flex-col items-center gap-4">
               <button 
                  onClick={resetElection} 
                  disabled={loading}
                  className="w-full px-10 py-5 rounded-[2rem] border-2 border-red-500/20 bg-red-500/10 text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
               >
                  {loading ? "Wiping Data..." : "Emergency Protocol Reset"}
               </button>
               <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest text-center">Wipes votes and resets user status</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-12">
           {/* Turnout Trend Chart */}
           <div className="xl:col-span-2 bg-[#0A0A0F]/80 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 shadow-lg">
              <div className="flex justify-between items-center mb-10">
                 <div>
                    <h3 className="text-xl font-black text-white tracking-tight">Data Visualization</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mt-1">Real-time participation flux</p>
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl text-emerald-600 font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Syncing
                 </div>
              </div>
              <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.turnoutTrend || []}>
                       <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                             <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                       <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                       <ChartTooltip 
                         contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} 
                         itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                         labelStyle={{ color: '#10b981', fontWeight: 'bold' }}
                       />
                       <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Security Alert Panel */}
           <div className="bg-slate-950 rounded-[3rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col h-[400px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-white/40">Security Monitor</h3>
              <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                 {securityAlerts.map((alert: any, i: number) => (
                    <div key={i} className="flex gap-4">
                       <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                          alert.level === 'danger' ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                       )}>
                          <AlertTriangle className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-xs font-black text-white mb-1 uppercase tracking-tight">{alert.action}</p>
                          <p className="text-[10px] text-white/40 leading-tight line-clamp-2">{alert.details}</p>
                       </div>
                    </div>
                 ))}
                 {securityAlerts.length === 0 && (
                    <div className="py-20 text-center opacity-20">
                       <ShieldCheck className="w-12 h-12 mx-auto mb-4" />
                       <p className="font-black uppercase text-[10px] tracking-widest text-white">System Secure</p>
                    </div>
                 )}
              </div>
              <button 
                onClick={() => setView('explorer')}
                className="w-full mt-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all shrink-0"
              >
                Audit Full Trace
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
            {/* Regional Participation */}
            <div className="bg-[#0A0A0F]/80 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 shadow-lg">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 text-white/30">Regional Power Grid</h3>
              <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.regionalTurnout || []}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                       <ChartTooltip 
                         cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
                         contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} 
                         itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                         labelStyle={{ color: '#10b981', fontWeight: 'bold' }}
                       />
                       <Bar dataKey="votes" fill="#10b981" radius={[12, 12, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Global Broadcast Panel */}
           <div className="bg-[#0A0A0F]/80 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 shadow-lg overflow-hidden relative">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-white/30">System-wide Broadcast</h3>
              <form onSubmit={handleBroadcast} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Alert Headline</label>
                    <input 
                       value={broadcastForm.title}
                       onChange={e => setBroadcastForm({...broadcastForm, title: e.target.value})}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-bold text-sm text-white outline-none focus:bg-white/10" 
                       placeholder="Emergency Protocol Announcement"
                       required
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Notification Payload</label>
                    <textarea 
                       value={broadcastForm.message}
                       onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 h-24 text-sm font-medium resize-none text-white outline-none focus:bg-white/10" 
                       placeholder="Enter message for the public ledger..."
                       required
                    />
                 </div>
                 <div className="flex gap-4">
                    {(['info', 'urgent', 'success'] as const).map(type => (
                       <button 
                          key={type}
                          type="button"
                          onClick={() => setBroadcastForm({...broadcastForm, type})}
                          className={cn(
                             "flex-1 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all",
                             broadcastForm.type === type ? "bg-emerald-500 text-slate-950 border-emerald-500" : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                          )}
                       >
                          {type}
                       </button>
                    ))}
                 </div>
                 <button type="submit" className="w-full py-5 bg-emerald-500 text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                    Synchronize Broadcast
                 </button>
              </form>
              <AnimatePresence>
                 {broadcastSuccess && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center">
                       <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                       <h4 className="text-xl font-black text-white mb-2 tracking-tight">Broadcast Distributed</h4>
                       <p className="text-white/40 text-xs font-medium">Alert has been stamped on the public chain notification layer.</p>
                    </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>

        <div className="bg-[#0A0A0F]/80 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 shadow-lg">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Delegate Management</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {candidates.map((c: any) => (
                <div key={c.id} className="p-6 rounded-3xl border border-white/5 bg-white/5 flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                      <div className="relative">
                         <img src={c.photo} className="w-12 h-12 rounded-xl object-cover" />
                         <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-950 rounded-lg shadow-sm flex items-center justify-center border border-white/10 p-0.5">
                            <SymbolRenderer symbol={c.symbol} className="w-full h-full" />
                         </div>
                      </div>
                      <div>
                         <p className="text-xs font-black text-white leading-none mb-1">{c.name}</p>
                         <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{c.party}</p>
                      </div>
                   </div>
                   <button onClick={() => onEditCandidate(c)} className="p-3 bg-white/5 rounded-xl border border-white/10 text-white/40 hover:text-emerald-500 hover:border-emerald-500 transition-all">
                      <Edit className="w-4 h-4" />
                   </button>
                </div>
              ))}
           </div>
        </div>

        <AnimatePresence>
           {showPublishModal && (
             <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-2xl bg-slate-950/60">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[3rem] max-w-md w-full p-12 shadow-2xl relative border border-slate-100">
                   <button onClick={() => setShowPublishModal(false)} className="absolute top-8 right-8 p-3 hover:bg-slate-50 rounded-2xl transition-all">
                      <X className="w-6 h-6 text-slate-400" />
                   </button>
                   <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl">
                      <ShieldCheck className="w-10 h-10 text-emerald-500" />
                   </div>
                   <h2 className="text-3xl font-black text-slate-950 mb-4 tracking-tighter">Publish Results</h2>
                   <p className="text-slate-500 font-medium mb-10 text-sm">Synchronizing local data with public sovereign chain requires administrative authorization protocol.</p>
                   
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Admin Access Credentials</label>
                        <input 
                          type="password" 
                          placeholder="Node access password"
                          value={publishPassword} 
                          onChange={e => setPublishPassword(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-bold text-slate-950 focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all outline-none" 
                        />
                        {publishError && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-1">{publishError}</p>}
                      </div>
                      
                      <button 
                        onClick={toggleResultsPublication} 
                        disabled={loading}
                        className="w-full bg-slate-950 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                        Broadcast Results
                      </button>
                   </div>
                </motion.div>
             </div>
           )}

           {editingCandidate && (
             <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 backdrop-blur-xl bg-black/40">
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[3rem] max-w-2xl w-full p-10 shadow-2xl relative">
                   <button onClick={() => setEditingCandidate(null)} className="absolute top-8 right-8 p-3 hover:bg-slate-50 rounded-2xl transition-all">
                      <X className="w-6 h-6 text-slate-400" />
                   </button>
                   <h2 className="text-2xl font-black text-slate-950 mb-8 flex items-center gap-4">
                      <Edit className="w-6 h-6 text-emerald-500" />
                      Modify Delegate Data
                   </h2>
                   <form onSubmit={onSaveCandidate} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Delegate Name</label>
                            <input value={candidateForm.name} onChange={e => setCandidateForm({...candidateForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-900" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Party Affiliation</label>
                            <input value={candidateForm.party} onChange={e => setCandidateForm({...candidateForm, party: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-900" />
                         </div>
                         <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Party Symbol (Emoji or URL)</label>
                            <input value={candidateForm.symbol} onChange={e => setCandidateForm({...candidateForm, symbol: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-900" />
                         </div>
                         <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Biometric Hash URL</label>
                            <input value={candidateForm.photo} onChange={e => setCandidateForm({...candidateForm, photo: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-900" />
                         </div>
                         <div className="col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mission Protocol (Bio)</label>
                            <textarea value={candidateForm.bio} onChange={e => setCandidateForm({...candidateForm, bio: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 h-24 font-bold text-slate-900 resize-none" />
                         </div>
                      </div>
                      <button type="submit" className="w-full bg-slate-950 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-950/20 active:scale-[0.98] transition-all">Synchronize Candidate Identity</button>
                   </form>
                </motion.div>
             </div>
           )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const BlockchainExplorer = ({ blockchain, setView, auth, setAuth, handleLogout, notifications, setShowNotifications, results }: any) => (
  <div className="min-h-screen bg-[#0f172a] text-white font-sans pb-24 relative overflow-hidden">
    <TopBar auth={auth} handleLogout={handleLogout} setView={setView} notifications={notifications} setShowNotifications={setShowNotifications} results={results} />
    <div className="max-w-5xl mx-auto px-6 py-12">
       <div className="flex justify-between items-end mb-12"><h2 className="text-4xl font-black tracking-tighter">Chain_Explorer</h2><button onClick={() => setView('results')} className="text-emerald-500 font-black uppercase text-[10px] tracking-widest border border-emerald-500/30 px-6 py-2 rounded-xl">Consensus Exit</button></div>
       <div className="space-y-6">
          {[...blockchain].reverse().map((b, i) => (
            <motion.div key={b.index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 md:p-12 hover:bg-white/10 transition-all">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-4 block">Cryptographic ID</span>
                    <p className="font-mono text-emerald-500 text-[10px] break-all bg-black/40 p-4 rounded-xl">
                      {auth.role === 'admin' ? "REDACTED_SECURITY_PROTOCOL_HASH" : b.hash}
                    </p>
                  </div>
                  <div className="bg-emerald-500 rounded-3xl p-8 text-[#020205]">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40 block mb-2">Block Details</span>
                    <p className="text-2xl font-black tracking-tighter mb-2">HEIGHT #{b.index}</p>
                    <p className="text-xs font-mono font-bold opacity-70 italic">
                      CONSENSUS SOURCE: {b.vote.candidateId === "REDACTED_PENDING_Consensus" ? "PENDING_OFFICIAL_ANNOUNCEMENT" : b.vote.candidateId}
                    </p>
                  </div>
               </div>
            </motion.div>
          ))}
       </div>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ role: null, user: null });
  const [view, setView] = useState<View>('landing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<{ uid: string, psw: string } | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<any>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [selectedCandidateModal, setSelectedCandidateModal] = useState<Candidate | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch('/api/candidates');
      if (res.ok) setCandidates(await res.json());
    } catch (e) {}
  }, []);

  const fetchResults = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        voterId: auth.user?.id || '',
        role: auth.role || '',
        view: view || ''
      });
      const res = await fetch(`/api/results?${query.toString()}`);
      if (res.ok) setResults(await res.json());
    } catch (e) {}
  }, [auth.user?.id, auth.role, view]);

  const fetchAuditLog = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/audit-log');
      if (res.ok) setAuditLog(await res.json());
    } catch (e) {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) setNotifications(await res.json());
    } catch (e) {}
  }, []);

  const fetchStats = useCallback(async () => {
    if (auth.role !== 'admin') return;
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) {}
  }, [auth.role]);

  useEffect(() => {
    fetchCandidates();
    fetchResults();
    fetchAuditLog();
    fetchNotifications();
    if (auth.role === 'admin') fetchStats();
  }, [fetchCandidates, fetchResults, fetchAuditLog, fetchNotifications, fetchStats, auth.role]);

  // Unified Real-time stream
  useEffect(() => {
    const eventSource = new EventSource('/api/stream');
    
    eventSource.addEventListener('notification', (e: any) => {
      setNotifications(prev => [JSON.parse(e.data), ...prev]);
    });

    eventSource.addEventListener('results', () => {
      fetchResults();
      if (auth.role === 'admin') fetchStats();
    });

    eventSource.addEventListener('audit', (e: any) => {
      setAuditLog(prev => [JSON.parse(e.data), ...prev]);
    });

    return () => eventSource.close();
  }, [fetchResults, fetchStats, auth.role]);

  const handleLogout = () => {
    setAuth({ role: null, user: null });
    setView('login');
  };

  const props = { 
    auth, setAuth, setView, setLoading, loading, 
    error, setError, warning, setWarning, results, 
    setResults, candidates, fetchResults, auditLog, 
    fetchAuditLog, regSuccess, setRegSuccess, 
    selectedCandidateModal, setSelectedCandidateModal,
    handleLogout, notifications, fetchNotifications, stats, fetchStats,
    setShowNotifications
  };

  return (
    <div className="selection:bg-emerald-200 selection:text-emerald-950 min-h-screen bg-[#0f172a] relative overflow-x-hidden">
      <TopSecurityBar results={results} auth={auth} />
      <SystemAlert regSuccess={regSuccess} onClose={() => setRegSuccess(null)} />
      {selectedCandidateModal && <CandidateModal auth={auth} candidate={selectedCandidateModal} onClose={() => setSelectedCandidateModal(null)} />}
      
      <AnimatePresence>
         {showNotifications && (
            <NotificationCenter notifications={notifications} onClose={() => setShowNotifications(false)} />
         )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LandingPage setView={setView} />
          </motion.div>
        )}
        {view === 'login' && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginPage {...props} />
          </motion.div>
        )}
        {view === 'register' && (
          <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RegisterPage {...props} />
          </motion.div>
        )}
        {view === 'vote' && (
          <motion.div key="vote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <VoteView {...props} />
          </motion.div>
        )}
        {view === 'results' && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <VoterResultsView {...props} />
          </motion.div>
        )}
        {view === 'admin' && (
          <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminView {...props} setAuditLog={setAuditLog} fetchCandidates={fetchCandidates} />
          </motion.div>
        )}
        {view === 'profile' && (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProfilePage {...props} />
          </motion.div>
        )}
        {view === 'explorer' && (
          <motion.div key="explorer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BlockchainExplorer {...props} blockchain={results?.blockchain || []} />
          </motion.div>
        )}
        {view === 'about' && (
          <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AboutPage {...props} />
          </motion.div>
        )}
        {view === 'help' && (
          <motion.div key="help" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HelpCenterPage {...props} />
          </motion.div>
        )}
        {view === 'contact' && (
          <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ContactPage {...props} />
          </motion.div>
        )}
        {view === 'admin-profile' && auth.role === 'admin' && (
          <motion.div key="admin-profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AdminProfilePage {...props} />
          </motion.div>
        )}
      </AnimatePresence>

      <Footer setView={setView} />

      {auth.role === 'admin' && view !== 'explorer' && (
        <button 
          onClick={() => setView('explorer')}
          className="fixed bottom-10 right-10 p-5 bg-slate-900 text-white rounded-full shadow-2xl hover:scale-110 transition-all z-40 group"
        >
          <Database className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 whitespace-nowrap transition-all">Sovereign Explorer</span>
        </button>
      )}
    </div>
  );
}
