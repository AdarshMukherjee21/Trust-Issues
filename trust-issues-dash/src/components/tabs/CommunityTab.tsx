"use client";
import React, { useEffect, useState } from "react";
import { fetchGraphData, getBackendStatus } from "@/app/lib/community_service";
import dynamic from "next/dynamic";

const ThreatGraph = dynamic(() => import("../ThreatGraph"), { ssr: false });

export default function CommunityTab({ currentUid }: { currentUid: string }) {
  const [loading, setLoading] = useState(true);
  const [backendOffline, setBackendOffline] = useState(false);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  // Local toggle for graph legend
  const [showLabels, setShowLabels] = useState(true);

  const checkBackendAndLoad = async (isManual = false) => {
    if (isManual || graphData.nodes.length === 0) setLoading(true);
    try {
      const status = await getBackendStatus();
      setLastChecked(new Date());

      if (!status?.is_active) {
        setBackendOffline(true);
        if (isManual || graphData.nodes.length === 0) setLoading(false);
        return;
      }

      const payload = await fetchGraphData(currentUid);
      const graphWrapper = payload?.data || payload;

      if (graphWrapper && graphWrapper.nodes) {
        const normalizedNodes = graphWrapper.nodes.map((n: any) => ({ ...n, id: n.id }));
        const normalizedLinks = graphWrapper.links.map((l: any) => ({ ...l, source: l.source, target: l.target }));
        setGraphData({ nodes: normalizedNodes, links: normalizedLinks });
        setBackendOffline(false);
      }
    } catch (e) {
      console.error("Failed fetching graph data:", e);
      setBackendOffline(true);
      setLastChecked(new Date());
    }
    setLoading(false);
  };

  useEffect(() => {
    checkBackendAndLoad();
    const interval = setInterval(() => {
      checkBackendAndLoad();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentUid]);

  if (loading && graphData.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
        <p className="text-emerald-400 font-bold tracking-widest animate-pulse uppercase text-xs">Synchronizing Threat Node Cluster...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-160px)]">

      {/* 20% Sidebar - Settings & Stats */}
      <div className="w-full lg:w-1/5 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">Intelligence</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Community Network </p>
        </div>

        {/* Status Card */}
        <div className={`p-4 rounded-2xl border backdrop-blur-md transition-all duration-500 shadow-xl ${backendOffline
          ? 'bg-red-500/10 border-red-500/30 shadow-red-500/5'
          : 'bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/5'
          }`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-2 h-2 rounded-full ${backendOffline ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${backendOffline ? 'text-red-500' : 'text-emerald-400'}`}>
              {backendOffline ? 'Offline' : 'Connected'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400 font-medium">Last Sync</p>
            <p className="text-zinc-200 text-[10px] font-mono">{lastChecked.toLocaleTimeString()}</p>
          </div>
          <button
            onClick={() => checkBackendAndLoad(true)}
            className="w-full mt-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] uppercase font-black text-white border border-white/5 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Force Ping
          </button>
        </div>


        {/* Stats Summary */}
        <div className="mt-auto p-4 border-t border-white/5 pt-6">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Total Nodes</p>
              <p className="text-xl font-black text-white">{graphData.nodes.length}</p>
            </div>

          </div>
        </div>
      </div>

      {/* 80% Main Content - The Graph */}
      <div className="w-full lg:w-4/5 h-full relative group">
        {backendOffline ? (
          <div className="h-full bg-zinc-950/50 border border-white/5 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center group-hover:bg-red-500/[0.02] transition-colors duration-700">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/20">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Cluster Link Severed</h2>
            <p className="text-zinc-500 max-w-sm text-sm">The decentralized threat server failed to respond. Graph visualization stream is currently inactive.</p>
          </div>
        ) : (
          <div className="h-full rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 ring-1 ring-white/5 relative bg-[#050505]">
            <ThreatGraph graphData={graphData} />
            {/* Bottom bar overlay for the graph specifically */}
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl flex items-center gap-4 shadow-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00E5FF]" />
                  <span className="text-[9px] font-black text-white uppercase tracking-tighter">Trusted Node</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#a855f7]" />
                  <span className="text-[9px] font-black text-white uppercase tracking-tighter">Payload</span>
                </div>
              </div>
              <div className="bg-black/80 backdrop-blur-sm border border-white/5 px-3 py-1.5 rounded-lg text-[9px] font-mono text-zinc-500 shadow-xl">
                RDR ENGINE ACTIVE // GPU ACCEL
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
