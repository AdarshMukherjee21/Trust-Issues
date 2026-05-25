"use client";
import React, { useEffect, useState } from "react";
import { getUserProfile, UserProfile, getSubcollectionCount } from "@/app/lib/user_service";
import { auth } from "@/app/lib/firebase";

// Helper function to calculate uptime
const getUptime = (timestampSeconds: number | undefined) => {
  if (!timestampSeconds) return null;

  const joinDate = new Date(timestampSeconds * 1000);
  const now = new Date();

  // Calculate difference in hours
  const diffInHours = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return "< 1 hr";
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hr' : 'hrs'}`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'}`;
  }
};

export default function ProfileTab({ uid, email }: { uid: string, email: string | null }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [counts, setCounts] = useState({ ai: 0, email: 0, sms: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const p = await getUserProfile(uid);
        if (p) setProfile(p);

        const aiC = await getSubcollectionCount(uid, "ai_asks");
        const emailC = await getSubcollectionCount(uid, "email_checks");
        const smsC = await getSubcollectionCount(uid, "sms_checks");
        setCounts({ ai: aiC, email: emailC, sms: smsC });
      } catch (e) {
        console.error("Failed to load profile", e);
      }
      setLoading(false);
    }
    fetchStats();
  }, [uid]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] w-full">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(6,182,212,0.3)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pt-4 pb-24 px-4 sm:px-0">
      
      {/* Profile Header Card */}
      <div className="bg-zinc-950/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-8 mb-12 relative z-10">
          <div className="relative">
            <div className="w-28 h-28 bg-gradient-to-br from-purple-500 via-[#FF0055] to-orange-500 rounded-[2rem] animate-spin-slow opacity-80" />
            <div className="absolute inset-1 bg-zinc-950 rounded-[1.8rem] flex items-center justify-center text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 border border-white/5 shadow-inner">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : '?')}
            </div>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-2">{profile?.name || "Anonymous User"}</h2>
            <p className="text-lg text-purple-400 font-bold tracking-widest uppercase">@{profile?.username || "unknown_node"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-white/5 relative z-10">
          <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 mb-2">Access Email</p>
            <p className="text-white text-sm font-bold truncate">{email || "N/A"}</p>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 mb-2">Age Identity</p>
            <p className="text-white text-sm font-bold">{profile?.age || "N/A"}</p>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 mb-2">Node Uptime</p>
            <p className="text-white text-sm font-bold flex flex-wrap items-center gap-2">
              {profile?.createdAt?.seconds ? (
                <>
                  {new Date(profile.createdAt.seconds * 1000).toLocaleDateString()}
                  <span className="text-zinc-500 text-xs font-bold tracking-widest uppercase bg-white/5 px-2 py-1 rounded">
                    {getUptime(profile.createdAt.seconds)}
                  </span>
                </>
              ) : (
                "New"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Sync Statistics Grid */}
      <div className="flex flex-col gap-4 w-full mt-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 ml-2">Lifetime Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'AI Scans', count: counts.ai, border: 'border-purple-500/20', text: 'text-purple-400' },
            { label: 'Email Checks', count: counts.email, border: 'border-emerald-500/20', text: 'text-emerald-400' },
            { label: 'SMS Filtered', count: counts.sms, border: 'border-sky-500/20', text: 'text-sky-400' }
          ].map((stat, i) => (
            <div key={i} className={`bg-zinc-950/80 border ${stat.border} p-8 rounded-3xl shadow-xl hover:bg-zinc-900 transition-all flex flex-col items-center justify-center text-center group`}>
              <p className="text-5xl font-black text-white leading-none tracking-tighter mb-4 group-hover:scale-110 transition-transform">{stat.count}</p>
              <p className={`text-[10px] font-black uppercase tracking-widest ${stat.text}`}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between mt-12 gap-6 px-4">
        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em]">Trust Issues Dash v1.0.5</p>
        
        {/* Log Out Button moved to the bottom footer area */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/50 text-red-500 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Disconnect Node
        </button>
      </div>

    </div>
  );
}