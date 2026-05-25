"use client";
import React, { useRef, useEffect, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface GraphProps {
  graphData: {
    nodes: any[];
    links: any[];
  };
  currentUid?: string;
  filters: { User: boolean; Threat: boolean; Sender: boolean };
  highlightData?: { nodes: Set<string> | null; links: Set<string> | null; color: string | null } | null;
}

const ThreatGraph: React.FC<GraphProps> = ({ graphData, currentUid, filters, highlightData }) => {
  const fgRef = useRef<any>(null);

  // Background Tracker State
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0, k: 1 });

  // Derived filtered data (now just passes everything through so filters only control opacity)
  const filteredData = useMemo(() => {
    if (!graphData || !graphData.nodes) return { nodes: [], links: [] };
    return { nodes: graphData.nodes, links: graphData.links || [] };
  }, [graphData]);

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
      
      {/* Top Right Legend */}
      <div className="absolute top-4 right-4 z-10 bg-black/60 border border-white/10 p-4 rounded-2xl backdrop-blur-md shadow-2xl pointer-events-none">
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Legend</h4>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 text-xs text-white font-semibold">
            <span className="w-3 h-3 rotate-45 bg-[#FF0055] shadow-[0_0_10px_#FF0055]" /> You
          </div>
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
        onZoom={(z) => setBgOffset({ x: z.x, y: z.y, k: z.k })}
        graphData={filteredData}
        nodeColor={(node: any) => {
          if (node.properties?.uid === currentUid) return '#FF0055';
          if (node.label === 'User') return '#00E5FF';
          if (node.label === 'Threat') return '#a855f7';
          if (node.label === 'Sender') return '#FFA500';
          return '#ffffff';
        }}
        linkColor={(link: any) => {
          let linkOpacity = 0.1;
          
          const srcNode = typeof link.source === 'object' ? link.source : graphData.nodes.find((n:any) => n.id === link.source);
          const tgtNode = typeof link.target === 'object' ? link.target : graphData.nodes.find((n:any) => n.id === link.target);
          
          if (srcNode && tgtNode) {
              if (!filters[srcNode.label as keyof typeof filters] || !filters[tgtNode.label as keyof typeof filters]) {
                  linkOpacity = 0.02;
              }
          }

          if (highlightData?.links && highlightData.links.size > 0) {
            const src = typeof link.source === 'object' ? link.source.id : link.source;
            const tgt = typeof link.target === 'object' ? link.target.id : link.target;
            const linkId = link.id || `${src}-${tgt}`;
            
            if (highlightData.links.has(linkId)) {
                return highlightData.color || '#ffffff';
            } else {
                return 'rgba(255,255,255,0.02)';
            }
          }
          return `rgba(255,255,255,${linkOpacity})`;
        }}
        linkWidth={(link: any) => {
          if (highlightData?.links && highlightData.links.size > 0) {
            const src = typeof link.source === 'object' ? link.source.id : link.source;
            const tgt = typeof link.target === 'object' ? link.target.id : link.target;
            const linkId = link.id || `${src}-${tgt}`;
            
            if (highlightData.links.has(linkId)) return 2;
          }
          return 1;
        }}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        nodeRelSize={6}
        backgroundColor="rgba(0,0,0,0)"
        
        // Custom Canvas Logic to render permanent static Labels directly beneath Nodes
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const isCurrentUser = node.properties?.uid === currentUid;
          const size = isCurrentUser ? 8 : 6; 
          
          let opacity = 1;

          // Apply dimming if node type is filtered out
          if (!filters[node.label as keyof typeof filters]) {
              opacity = 0.15;
          }

          // Path highlighting overrides/stacks
          if (highlightData?.nodes && highlightData.nodes.size > 0) {
              if (!highlightData.nodes.has(node.id)) {
                  opacity = 0.15;
              }
          }
          ctx.globalAlpha = opacity;

          let color = '#ffffff';
          if (isCurrentUser) color = '#FF0055';
          else if (node.label === 'User') color = '#00E5FF';
          else if (node.label === 'Threat') color = '#a855f7';
          else if (node.label === 'Sender') color = '#FFA500';
          
          ctx.beginPath();
          if (isCurrentUser) {
            ctx.moveTo(node.x, node.y - size);
            ctx.lineTo(node.x + size, node.y);
            ctx.lineTo(node.x, node.y + size);
            ctx.lineTo(node.x - size, node.y);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();
          } else {
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
          }

          // Performance + Aesthetic optimization: only show labels if somewhat zipped-in 
          if (globalScale > 0.6) {
            let label = node.id;
            if (isCurrentUser) label = 'You';
            else if (node.label === 'User') label = node.properties?.username || 'User';
            else if (node.label === 'Threat') label = node.properties?.type || 'Threat';
            else if (node.label === 'Sender') label = node.properties?.contact || 'Origin';
            
            // Size scales inversely so that texts remain readable
            const fontSize = isCurrentUser ? 12 / globalScale : 11 / globalScale; 
            ctx.font = `${isCurrentUser ? '900' : '600'} ${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const yOffset = node.y + size + (8 / globalScale);
            
            // Simulate pure "CSS Text Edge Shadow" by plotting dark undertext first
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillText(label, node.x, yOffset + 0.5);
            ctx.fillText(label, node.x, yOffset - 0.5);
            ctx.fillText(label, node.x + 0.5, yOffset);
            ctx.fillText(label, node.x - 0.5, yOffset);
            
            // Plot actual bright label right on top
            ctx.fillStyle = isCurrentUser ? '#FF0055' : 'rgba(255,255,255,0.95)';
            ctx.fillText(label, node.x, yOffset);
          }

          ctx.globalAlpha = 1; // Reset opacity
        }}
      />
    </div>
  );
};

export default ThreatGraph;
