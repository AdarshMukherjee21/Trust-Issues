"use client";
import React, { useRef, useEffect, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface GraphProps {
  graphData: {
    nodes: any[];
    links: any[];
  };
}

const ThreatGraph: React.FC<GraphProps> = ({ graphData }) => {
  const fgRef = useRef<any>(null);

  // Filter states
  const [filters, setFilters] = useState({
    User: true,
    Threat: true,
    Sender: true,
  });

  // Background Tracker State
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0, k: 1 });

  // Derived filtered data
  const filteredData = useMemo(() => {
    if (!graphData || !graphData.nodes) return { nodes: [], links: [] };

    const validNodes = graphData.nodes.filter(n => filters[n.label as keyof typeof filters]);
    const validNodeIds = new Set(validNodes.map(n => n.id));
    
    // Links must have both source and target in the valid nodes
    const validLinks = (graphData.links || []).filter(
      l => 
        validNodeIds.has(typeof l.source === 'object' ? l.source.id : l.source) &&
        validNodeIds.has(typeof l.target === 'object' ? l.target.id : l.target)
    );

    return { nodes: validNodes, links: validLinks };
  }, [graphData, filters]);

  // Tighten layout on load via D3 engine variables naturally exposed by the wrapper
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-300); // Strong repulsion blocks overlap since we use labels now
      fgRef.current.d3Force('link').distance(40); // Tighter strings between nodes
    }
  }, []);

  // Make the graph fit the container beautifully on load
  useEffect(() => {
    if (fgRef.current && filteredData.nodes.length > 0) {
      setTimeout(() => {
        // Enforce a strict closer zoom scale instead of relying on zoomToFit's wild padding
        fgRef.current?.zoom(2.0, 800);
        fgRef.current?.centerAt(0, 0, 800);
      }, 500); // Wait a half tick for physics engine to settle nodes
    }
  }, [filteredData]);

  const toggleFilter = (type: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div 
      className="relative w-full h-[600px] bg-[#050505] rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,
        backgroundSize: `${40 * Math.max(0.5, bgOffset.k)}px ${40 * Math.max(0.5, bgOffset.k)}px`,
        backgroundPosition: `${bgOffset.x}px ${bgOffset.y}px`,
        transition: 'background-size 0.1s ease-out'
      }}
    >
      
      {/* Top Left Filters */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 shadow-black drop-shadow-md">Filters</h4>
        {(['User', 'Threat', 'Sender'] as const).map(type => (
          <button 
            key={type}
            onClick={() => toggleFilter(type)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-lg ${
              filters[type] 
                ? 'bg-black/60 border-white/20 text-white backdrop-blur-md' 
                : 'bg-black/20 border-white/5 text-zinc-600 backdrop-blur-sm'
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

      {/* Bottom Right Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/60 border border-white/10 p-4 rounded-2xl backdrop-blur-md shadow-2xl pointer-events-none">
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Legend</h4>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 text-xs text-white font-semibold">
            <span className="w-3 h-3 rounded-full bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]" /> Trusted User
          </div>
          <div className="flex items-center gap-2.5 text-xs text-white font-semibold">
            <span className="w-3 h-3 rounded-full bg-[#a855f7] shadow-[0_0_10px_#a855f7]" /> Recorded Threat
          </div>
          <div className="flex items-center gap-2.5 text-xs text-white font-semibold">
            <span className="w-3 h-3 rounded-full bg-[#FFA500] shadow-[0_0_10px_#FFA500]" /> Suspicious Origin
          </div>
        </div>
      </div>

      {/* Floating Zoom Dials */}
      <div className="absolute top-1/2 right-4 -translate-y-1/2 z-10 flex flex-col gap-2 bg-black/60 border border-white/10 p-2 rounded-2xl backdrop-blur-md shadow-2xl">
        <button 
          onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.5, 400)} 
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-95"
          title="Zoom In"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
        <button 
          onClick={() => fgRef.current?.zoomToFit(400, 50)} 
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/20 text-emerald-400 flex items-center justify-center transition-colors active:scale-95 text-[10px] font-black uppercase tracking-tighter"
          title="Fit to Screen"
        >
          FIT
        </button>
        <button 
          onClick={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.5, 400)} 
          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-95"
          title="Zoom Out"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
        </button>
      </div>

      <ForceGraph2D
        ref={fgRef}
        onZoom={(z: any) => setBgOffset({ x: z.x, y: z.y, k: z.k })}
        graphData={filteredData}
        nodeColor={(node: any) => {
          if (node.label === 'User') return '#00E5FF';
          if (node.label === 'Threat') return '#a855f7';
          if (node.label === 'Sender') return '#FFA500';
          return '#ffffff';
        }}
        linkColor={() => 'rgba(255,255,255,0.1)'}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        nodeRelSize={6}
        backgroundColor="rgba(0,0,0,0)"
        
        // Custom Canvas Logic to render permanent static Labels directly beneath Nodes
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const size = 6; 
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
          
          let color = '#ffffff';
          if (node.label === 'User') color = '#00E5FF';
          if (node.label === 'Threat') color = '#a855f7';
          if (node.label === 'Sender') color = '#FFA500';
          
          ctx.fillStyle = color;
          ctx.fill();

          // Performance + Aesthetic optimization: only show labels if somewhat zipped-in 
          if (globalScale > 0.6) {
            let label = node.id;
            if (node.label === 'User') label = node.properties?.username || 'User';
            if (node.label === 'Threat') label = node.properties?.type || 'Threat';
            if (node.label === 'Sender') label = node.properties?.contact || 'Origin';
            
            // Size scales inversely so that texts remain readable
            const fontSize = 11 / globalScale; 
            ctx.font = `600 ${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Simulate pure "CSS Text Edge Shadow" by plotting dark undertext first
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillText(label, node.x, node.y + size + (8 / globalScale) + 0.5);
            ctx.fillText(label, node.x, node.y + size + (8 / globalScale) - 0.5);
            ctx.fillText(label, node.x + 0.5, node.y + size + (8 / globalScale));
            ctx.fillText(label, node.x - 0.5, node.y + size + (8 / globalScale));
            
            // Plot actual bright label right on top
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.fillText(label, node.x, node.y + size + (8 / globalScale));
          }
        }}
      />
    </div>
  );
};

export default ThreatGraph;
