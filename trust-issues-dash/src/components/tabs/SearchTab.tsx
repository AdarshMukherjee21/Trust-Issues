"use client";
import React, { useState, useEffect } from "react";
import {
  searchUsers,
  sendFriendRequest,
  SearchUserResult,
  listenToIncomingRequests,
  listenToSentRequests, // NEW
  removeOrCancelFriend, // NEW
  FriendStatus,
  acceptFriendRequest
} from "@/app/lib/friends_service"; // Ensure your import path matches your project

export default function SearchTab({ currentUid }: { currentUid: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestedUids, setRequestedUids] = useState<Set<string>>(new Set());

  const [incomingRequests, setIncomingRequests] = useState<FriendStatus[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendStatus[]>([]); // NEW

  useEffect(() => {
    const unsubIncoming = listenToIncomingRequests(currentUid, setIncomingRequests);
    const unsubSent = listenToSentRequests(currentUid, setSentRequests); // NEW

    return () => {
      unsubIncoming();
      unsubSent();
    };
  }, [currentUid]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const users = await searchUsers(searchTerm.trim());
    setResults(users.filter(u => u.uid !== currentUid));
    setLoading(false);
  };

  const handleAddFriend = async (targetUid: string) => {
    try {
      await sendFriendRequest(currentUid, targetUid);
      setRequestedUids(prev => new Set(prev).add(targetUid));
    } catch (e) {
      console.error("Failed to send request", e);
    }
  };

  const handleAccept = async (targetUid: string) => {
    try {
      await acceptFriendRequest(currentUid, targetUid);
    } catch (e) {
      console.error("Error accepting friend request", e);
    }
  };

  // NEW: Handle Rejecting or Canceling
  const handleRejectOrCancel = async (targetUid: string) => {
    try {
      await removeOrCancelFriend(currentUid, targetUid);
      // Clean up the local requested state so the "Add Friend" button resets
      setRequestedUids(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUid);
        return newSet;
      });
    } catch (e) {
      console.error("Error removing/canceling friend request", e);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-160px)]">
      {/* Left Pane - Fuzzy Search */}
      <div className="w-full lg:w-1/2 flex flex-col pt-4">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-6">Network Discovery</h2>

        <form onSubmit={handleSearch} className="relative mb-8 group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Fuzzy search username, name or UID..."
            className="w-full bg-zinc-900/40 border border-white/10 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-purple-500/50 transition-all text-white placeholder:text-zinc-600 shadow-xl backdrop-blur-md"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 bg-white text-black px-4 rounded-xl font-bold hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </form>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {results.length === 0 && !loading && searchTerm && (
            <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-zinc-500 font-medium">No matches found in the shadow network.</p>
            </div>
          )}

          {results.map((user) => {
            // Disable button if already sent this session OR if it exists in our real-time sentRequests array
            const isRequested = requestedUids.has(user.uid) || sentRequests.some(req => req.uid === user.uid);

            return (
              <div key={user.uid} className="group flex items-center justify-between bg-zinc-900/30 hover:bg-zinc-900/60 transition-all border border-white/5 p-4 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-emerald-500/20 border border-white/10 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-inner group-hover:scale-110 transition-transform">
                    {user.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h4 className="text-white font-bold group-hover:text-purple-400 transition-colors">{user.name}</h4>
                    <p className="text-xs text-zinc-500 font-mono">@{user.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAddFriend(user.uid)}
                  disabled={isRequested}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${isRequested
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95'
                    }`}
                >
                  {isRequested ? 'Requested' : 'Add Friend'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Pane - Incoming & Outgoing Requests */}
      <div className="w-full lg:w-1/2 flex flex-col gap-8 lg:border-l lg:border-white/5 lg:pl-8 pt-4">

        {/* Incoming Section */}
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Incoming Requests</h3>
            {incomingRequests.length > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">{incomingRequests.length} New</span>}
          </div>

          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {incomingRequests.length === 0 ? (
              <div className="h-24 flex items-center justify-center border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                <p className="text-zinc-600 text-xs font-medium uppercase tracking-widest">Quiet on the wire</p>
              </div>
            ) : (
              incomingRequests.map(req => (
                <div key={req.uid} className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold truncate max-w-[100px] sm:max-w-[140px]">{req.uid}</p>
                      <p className="text-emerald-400/60 text-[10px] font-bold uppercase tracking-tighter">Wants to pair</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectOrCancel(req.uid)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] uppercase font-black px-3 py-2 rounded-lg transition-all active:scale-95"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAccept(req.uid)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase font-black px-4 py-2 rounded-lg transition-all active:scale-95"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Outgoing Section */}
        <div className="flex flex-col gap-4 flex-1 border-t border-white/5 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Outgoing Requests ({sentRequests.length})</h3>

          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {sentRequests.length === 0 ? (
              <div className="h-24 flex items-center justify-center border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                <p className="text-zinc-600 text-xs font-medium uppercase tracking-widest">No pending outgoing</p>
              </div>
            ) : (
              sentRequests.map(req => (
                <div key={req.uid} className="bg-cyan-500/5 border border-cyan-500/10 p-4 rounded-2xl flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold truncate max-w-[120px]">{req.uid}</p>
                      <p className="text-cyan-500/60 text-[10px] font-bold uppercase tracking-tighter">Awaiting Response</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRejectOrCancel(req.uid)}
                    className="bg-zinc-800/50 hover:bg-red-500/20 hover:text-red-400 text-zinc-500 text-[10px] uppercase font-black px-4 py-2 rounded-lg transition-all active:scale-95 border border-transparent hover:border-red-500/30"
                  >
                    Cancel
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}