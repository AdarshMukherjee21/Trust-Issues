"use client";
import React, { useState, useEffect } from "react";
import AuthGate from "@/components/AuthGate";
import BottomNav, { Tab } from "@/components/BottomNav";
import DashboardTabs from "@/components/DashboardTabs";
import { auth } from "@/app/lib/firebase";
import { User } from "firebase/auth";
import { listenToIncomingRequests, FriendStatus, acceptFriendRequest } from "@/app/lib/friends_service";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("my_checks");
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<FriendStatus[]>([]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubRequests = listenToIncomingRequests(user.uid, (reqs) => {
        setRequests(reqs);
      });
      return () => unsubRequests();
    }
  }, [user]);

  const handleAccept = async (targetUid: string) => {
    if (!user) return;
    try {
      await acceptFriendRequest(user.uid, targetUid);
    } catch (e) {
      console.error("Error accepting friend request", e);
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-black text-white flex flex-col font-sans relative overflow-x-hidden pt-4">
        {/* Friend Requests Toast */}
        {requests.length > 0 && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-[90%] max-w-sm pointer-events-auto">
            {requests.map(req => (
              <div key={req.uid} className="bg-zinc-900/90 backdrop-blur-2xl border border-white/20 p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-10 fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">New Request</p>
                    <p className="text-zinc-400 text-xs font-mono">{req.uid.substring(0, 8)}...</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleAccept(req.uid)}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Dashboard Content */}
        {user ? (
          <DashboardTabs activeTab={activeTab} user={user} />
        ) : (
          <div className="flex-1 flex items-center justify-center relative z-10 min-h-screen">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Floating Navigation */}
        {user && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
      </div>
    </AuthGate>
  );
}
