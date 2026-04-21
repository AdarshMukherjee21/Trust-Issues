"use client";

import React from "react";

export type Tab = "my_checks" | "search" | "community" | "profile";

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: "my_checks", label: "My Checks", icon: <HomeIcon /> },
    { id: "search", label: "Search", icon: <SearchIcon /> },
    { id: "community", label: "Community", icon: <UsersIcon /> },
    { id: "profile", label: "Profile", icon: <UserIcon /> },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 md:pb-10 px-4 pointer-events-none">
      <div className="flex items-center justify-between w-full max-w-xl px-4 py-3 bg-neutral-950/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] pointer-events-auto transform shadow-[0_20px_40px_-5px_rgba(168,85,247,0.3)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex flex-col items-center justify-center w-24 h-14 rounded-2xl transition-all duration-300 relative ${
                isActive ? "text-purple-400 bg-white/5" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
              }`}
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-purple-500 rounded-b-full shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
              )}
              <div className={`mb-0.5 transition-transform duration-300 ${isActive ? "scale-110" : ""}`}>
                {tab.icon}
              </div>
              <span className={`text-[10px] font-medium transition-all duration-300 ${isActive ? "opacity-100 translate-y-0" : "opacity-0 absolute translate-y-4"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Inline SVGs for minimalism
const HomeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const SearchIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
