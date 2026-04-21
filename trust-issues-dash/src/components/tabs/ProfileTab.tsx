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
    <div className="flex flex-col gap-10 max-w-5xl mx-auto pt-4 pb-20">

      {/* Profile Header Card */}
      <div className="bg-[#0A1128]/40 backdrop-blur-3xl border border-[#00E5FF]/20 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group hover:border-[#00E5FF]/40 transition-all duration-500">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-8 mb-10 relative z-10">
          <div className="flex items-center gap-8">
            <div className="relative">
              {/* Swapped purple gradient for cool blue tones */}
              <div className="w-32 h-32 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-full animate-spin-slow opacity-80" />
              <div className="absolute inset-1 bg-[#121C3A] rounded-full flex items-center justify-center text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 border border-white/5 shadow-2xl">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : '?')}
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter mb-1 select-none">{profile?.name || "Anonymous User"}</h2>
              <p className="text-xl text-cyan-400 font-bold tracking-widest drop-shadow-lg">@{profile?.username || "unknown_node"}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 group shadow-xl flex items-center gap-2"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            log out
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-10 border-t border-white/5 relative z-10">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-cyan-800 mb-2">Access Email</p>
            <p className="text-slate-200 text-sm font-bold truncate pr-4">{email || "N/A"}</p>
          </div>
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-cyan-800 mb-2">Age Identity</p>
            <p className="text-slate-200 text-sm font-bold">{profile?.age || "N/A"}</p>
          </div>

          {/* Updated Node Uptime Section */}
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-cyan-800 mb-2">Node Uptime</p>
            <p className="text-slate-200 text-sm font-bold">
              {profile?.createdAt?.seconds ? (
                <>
                  {new Date(profile.createdAt.seconds * 1000).toLocaleDateString()}
                  <span className="text-slate-400 text-xs ml-2 font-normal tracking-wide">
                    ({getUptime(profile.createdAt.seconds)})
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
      <div className="flex flex-col gap-6 w-full">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Sync Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'AI Scans', count: counts.ai, shadow: 'shadow-cyan-500/10', border: 'border-cyan-500/20' },
            { label: 'Email Checks', count: counts.email, shadow: 'shadow-blue-500/10', border: 'border-blue-500/20' },
            { label: 'SMS Filtered', count: counts.sms, shadow: 'shadow-indigo-500/10', border: 'border-indigo-500/20' }
          ].map((stat, i) => (
            <div key={i} className={`bg-[#121C3A]/60 border ${stat.border} p-8 rounded-[2.5rem] shadow-xl hover:bg-[#121C3A]/80 transition-all ${stat.shadow} flex flex-col items-center text-center`}>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{stat.label}</p>
              <p className="text-5xl font-black text-white leading-none tracking-tighter">{stat.count}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mt-10">Trust Issues Dash v1.0.5 - Secure Segment</p>

    </div>
  );
}