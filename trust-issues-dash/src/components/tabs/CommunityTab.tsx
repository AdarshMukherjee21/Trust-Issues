"use client";
import React, { useEffect, useState, useMemo } from "react";
import { fetchGraphData, getBackendStatus } from "@/app/lib/community_service";
import dynamic from "next/dynamic";

const ThreatGraph = dynamic(() => import("../ThreatGraph"), { ssr: false });

export default function CommunityTab({ currentUid }: { currentUid: string }) {
  const [loading, setLoading] = useState(true);
  const [backendOffline, setBackendOffline] = useState(false);
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] });
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  // Local toggle for graph legend
  const [showLabels, setShowLabels] = useState(true);

  const [filters, setFilters] = useState({
    User: true,
    Threat: true,
    Sender: true,
  });

  const [activeStat, setActiveStat] = useState<string | null>(null);

  // Compute stats
  const stats = useMemo(() => {
    if (!graphData || !graphData.nodes.length) return null;

    const users = graphData.nodes.filter((n: any) => n.label === 'User');
    const threats = graphData.nodes.filter((n: any) => n.label === 'Threat');
    
    const linksByNode = new Map();
    graphData.links.forEach((l: any) => {
        const src = typeof l.source === 'object' ? l.source.id : l.source;
        const tgt = typeof l.target === 'object' ? l.target.id : l.target;
        if (!linksByNode.has(src)) linksByNode.set(src, []);
        if (!linksByNode.has(tgt)) linksByNode.set(tgt, []);
        linksByNode.get(src).push(tgt);
        linksByNode.get(tgt).push(src);
    });

    const myNodeId = graphData.nodes.find((n: any) => n.label === 'User' && n.properties?.uid === currentUid)?.id;

    if (!myNodeId) {
        return {
            totalFriends: Math.max(0, users.length - 1),
            sharedThreats: 0,
            friendsWithOverlap: 0,
            totalThreats: threats.length,
            repeatOffenders: 0,
            myNodeId: null,
            sharedThreatIds: new Set<string>(),
            friendsWithSharedThreats: new Set<string>(),
            repeatOffenderIds: new Set<string>(),
            repeatOffenderThreatIds: new Set<string>(),
            myThreatIds: []
        };
    }

    const myConnections = linksByNode.get(myNodeId) || [];
    const myThreatIds = myConnections.filter((id: any) => {
        const node = graphData.nodes.find((n: any) => n.id === id);
        return node && node.label === 'Threat';
    });

    const sharedThreatIds = new Set<string>();
    const friendsWithSharedThreats = new Set<string>();
    const sendersTargetingMe = new Map<string, number>();

    myThreatIds.forEach((threatId: any) => {
        const threatConnections = linksByNode.get(threatId) || [];
        threatConnections.forEach((connId: any) => {
            if (connId !== myNodeId) {
                const node = graphData.nodes.find((n: any) => n.id === connId);
                if (node && node.label === 'User') {
                    sharedThreatIds.add(threatId);
                    friendsWithSharedThreats.add(connId);
                } else if (node && node.label === 'Sender') {
                    sendersTargetingMe.set(connId, (sendersTargetingMe.get(connId) || 0) + 1);
                }
            }
        });
    });

    let repeatOffenderCount = 0;
    const repeatOffenderIds = new Set<string>();
    const repeatOffenderThreatIds = new Set<string>();

    sendersTargetingMe.forEach((count, senderId) => {
        if (count > 1) {
            repeatOffenderCount++;
            repeatOffenderIds.add(senderId);
            const senderConns = linksByNode.get(senderId) || [];
            senderConns.forEach((threatId: any) => {
                if (myThreatIds.includes(threatId)) {
                    repeatOffenderThreatIds.add(threatId);
                }
            });
        }
    });

    return {
        totalFriends: Math.max(0, users.length - 1),
        sharedThreats: sharedThreatIds.size,
        friendsWithOverlap: friendsWithSharedThreats.size,
        totalThreats: threats.length,
        repeatOffenders: repeatOffenderCount,
        myNodeId,
        sharedThreatIds,
        friendsWithSharedThreats,
        repeatOffenderIds,
        repeatOffenderThreatIds,
        myThreatIds
    };
  }, [graphData, currentUid]);

  const highlightData = useMemo(() => {
    if (!activeStat || !stats || !stats.myNodeId) return null;
    
    const hNodes = new Set<string>();
    const hLinks = new Set<string>();
    
    hNodes.add(stats.myNodeId);
    let color = '#ffffff';

    if (activeStat === 'shared_threats') {
        color = '#a855f7';
        stats.sharedThreatIds.forEach((id: string) => hNodes.add(id));
        
        graphData.links.forEach((l: any) => {
            const src = typeof l.source === 'object' ? l.source.id : l.source;
            const tgt = typeof l.target === 'object' ? l.target.id : l.target;
            if ( (src === stats.myNodeId && stats.sharedThreatIds.has(tgt)) || 
                 (tgt === stats.myNodeId && stats.sharedThreatIds.has(src)) ) {
                hLinks.add(l.id || `${src}-${tgt}`);
            }
        });
    } else if (activeStat === 'friends_at_risk') {
        color = '#FF0055';
        stats.sharedThreatIds.forEach((id: string) => hNodes.add(id));
        stats.friendsWithSharedThreats.forEach((id: string) => hNodes.add(id));
        
        graphData.links.forEach((l: any) => {
            const src = typeof l.source === 'object' ? l.source.id : l.source;
            const tgt = typeof l.target === 'object' ? l.target.id : l.target;
            
            const isMeToThreat = (src === stats.myNodeId && stats.sharedThreatIds.has(tgt)) || (tgt === stats.myNodeId && stats.sharedThreatIds.has(src));
            const isFriendToThreat = (stats.friendsWithSharedThreats.has(src) && stats.sharedThreatIds.has(tgt)) || (stats.friendsWithSharedThreats.has(tgt) && stats.sharedThreatIds.has(src));

            if (isMeToThreat || isFriendToThreat) {
                hLinks.add(l.id || `${src}-${tgt}`);
            }
        });
    } else if (activeStat === 'repeat_origins') {
        color = '#FFA500'; // Orange for sender
        stats.repeatOffenderIds.forEach((id: string) => hNodes.add(id));
        stats.repeatOffenderThreatIds.forEach((id: string) => hNodes.add(id));
        
        graphData.links.forEach((l: any) => {
            const src = typeof l.source === 'object' ? l.source.id : l.source;
            const tgt = typeof l.target === 'object' ? l.target.id : l.target;
            
            const isMeToThreat = (src === stats.myNodeId && stats.repeatOffenderThreatIds.has(tgt)) || (tgt === stats.myNodeId && stats.repeatOffenderThreatIds.has(src));
            const isSenderToThreat = (stats.repeatOffenderIds.has(src) && stats.repeatOffenderThreatIds.has(tgt)) || (stats.repeatOffenderIds.has(tgt) && stats.repeatOffenderThreatIds.has(src));

            if (isMeToThreat || isSenderToThreat) {
                hLinks.add(l.id || `${src}-${tgt}`);
            }
        });
    }
    return { nodes: hNodes, links: hLinks, color };
  }, [activeStat, stats, graphData]);

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
      <div className="w-full lg:w-1/5 flex flex-col gap-6 overflow-y-auto h-full pr-2 pb-4">
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


        {/* Toggle Filters */}
        <div className="mt-4 px-2">
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Filters</h4>
          <div className="flex flex-wrap gap-2">
            {(['User', 'Threat', 'Sender'] as const).map(type => (
              <button 
                key={type}
                onClick={() => setFilters(prev => ({ ...prev, [type]: !prev[type] }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                  filters[type] 
                    ? 'bg-black/60 border-white/20 text-white shadow-lg' 
                    : 'bg-black/20 border-white/5 text-zinc-600'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ 
                  backgroundColor: type === 'User' ? '#00E5FF' : (type === 'Threat' ? '#a855f7' : '#FFA500'),
                  opacity: filters[type] ? 1 : 0.3,
                  boxShadow: filters[type] ? `0 0 10px ${type === 'User' ? '#00E5FF' : (type === 'Threat' ? '#a855f7' : '#FFA500')}` : 'none'
                }} />
                {type}s
              </button>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-auto p-4 border-t border-white/5 pt-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Network Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Total Nodes</p>
              <p className="text-lg font-black text-white">{graphData.nodes.length}</p>
            </div>
            {stats && (
              <>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Total Threats</p>
                  <p className="text-lg font-black text-white">{stats.totalThreats}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Friends</p>
                  <p className="text-lg font-black text-[#00E5FF]">{stats.totalFriends}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Shared Threats</p>
                  <p className="text-lg font-black text-[#a855f7]">{stats.sharedThreats}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Friends at Risk</p>
                  <p className="text-lg font-black text-[#FF0055]">{stats.friendsWithOverlap}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Repeat Origins</p>
                  <p className="text-lg font-black text-[#FFA500]">{stats.repeatOffenders}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-4 flex flex-col gap-2">
            <button 
                onClick={() => setActiveStat(activeStat === 'shared_threats' ? null : 'shared_threats')}
                className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeStat === 'shared_threats' ? 'bg-[#a855f7]/20 border-[#a855f7]/50 text-[#a855f7]' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}`}
            >
                View Shared Threats
            </button>
            <button 
                onClick={() => setActiveStat(activeStat === 'friends_at_risk' ? null : 'friends_at_risk')}
                className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeStat === 'friends_at_risk' ? 'bg-[#FF0055]/20 border-[#FF0055]/50 text-[#FF0055]' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}`}
            >
                View Friends at Risk
            </button>
            <button 
                onClick={() => setActiveStat(activeStat === 'repeat_origins' ? null : 'repeat_origins')}
                className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeStat === 'repeat_origins' ? 'bg-[#FFA500]/20 border-[#FFA500]/50 text-[#FFA500]' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'}`}
            >
                View Repeat Origins
            </button>
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
            <ThreatGraph 
              graphData={graphData} 
              currentUid={currentUid} 
              filters={filters}
              highlightData={highlightData}
            />
            {/* Bottom bar overlay for the graph specifically */}
            <div className="absolute bottom-6 right-6 flex justify-end pointer-events-none">
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
