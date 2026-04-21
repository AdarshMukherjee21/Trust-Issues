"use client";

import React from "react";
import { User } from "firebase/auth";
import { Tab } from "./BottomNav";
import MyChecksTab from "./tabs/MyChecksTab";
import SearchTab from "./tabs/SearchTab";
import CommunityTab from "./tabs/CommunityTab";
import ProfileTab from "./tabs/ProfileTab";

interface DashboardTabsProps {
  activeTab: Tab;
  user: User;
}

export default function DashboardTabs({ activeTab, user }: DashboardTabsProps) {
  return (
    <div className="w-full max-w-[1400px] mx-auto pb-32 relative z-10 pt-8 px-4 sm:px-10">
      {activeTab === "my_checks" && <MyChecksTab uid={user.uid} />}
      {activeTab === "search" && <SearchTab currentUid={user.uid} />}
      {activeTab === "community" && <CommunityTab currentUid={user.uid} />}
      {activeTab === "profile" && <ProfileTab uid={user.uid} email={user.email} />}
    </div>
  );
}
