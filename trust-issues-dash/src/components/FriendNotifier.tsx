"use client";
import React, { useEffect, useState, useRef } from "react";
import { listenToIncomingRequests, listenToFriends, FriendStatus } from "@/app/lib/friends_service";
import { auth } from "@/app/lib/firebase"; // Make sure this path is correct!

interface Notification {
    id: string;
    title: string;
    message: string;
    type: "incoming" | "accepted";
}

export default function FriendNotifier() {
    const [currentUid, setCurrentUid] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Refs to track previous state
    const isInitialLoadReq = useRef(true);
    const isInitialLoadFriends = useRef(true);
    const prevIncoming = useRef<Set<string>>(new Set());
    const prevFriends = useRef<Set<string>>(new Set());

    // 1. Auth Listener: Find out who is logged in
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                setCurrentUid(user.uid);
            } else {
                setCurrentUid(null);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // 2. Network Listener: Only runs if we have a currentUid
    useEffect(() => {
        if (!currentUid) return;

        const unsubIncoming = listenToIncomingRequests(currentUid, (requests) => {
            if (isInitialLoadReq.current) {
                prevIncoming.current = new Set(requests.map(r => r.uid));
                isInitialLoadReq.current = false;
                return;
            }

            const currentIds = new Set(requests.map(r => r.uid));
            requests.forEach(req => {
                if (!prevIncoming.current.has(req.uid)) {
                    addNotification({
                        id: Date.now().toString() + req.uid,
                        title: "Network Breach",
                        message: `New pairing request from ${req.uid}`,
                        type: "incoming"
                    });
                }
            });
            prevIncoming.current = currentIds;
        });

        const unsubFriends = listenToFriends(currentUid, (friends) => {
            if (isInitialLoadFriends.current) {
                prevFriends.current = new Set(friends.map(f => f.uid));
                isInitialLoadFriends.current = false;
                return;
            }

            const currentIds = new Set(friends.map(f => f.uid));
            friends.forEach(friend => {
                if (!prevFriends.current.has(friend.uid)) {
                    addNotification({
                        id: Date.now().toString() + friend.uid,
                        title: "Node Linked",
                        message: `${friend.uid} has joined your trusted network.`,
                        type: "accepted"
                    });
                }
            });
            prevFriends.current = currentIds;
        });

        return () => {
            unsubIncoming();
            unsubFriends();
        };
    }, [currentUid]);

    const addNotification = (notif: Notification) => {
        setNotifications(prev => [...prev, notif]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notif.id));
        }, 5000);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // If no user is logged in, or there are no notifications, render absolutely nothing.
    if (!currentUid || notifications.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
            {notifications.map((notif) => (
                <div
                    key={notif.id}
                    className="pointer-events-auto flex items-start gap-4 w-80 p-4 bg-[#0A0A0F]/80 backdrop-blur-xl border-l-4 border-y border-r border-white/5 rounded-r-2xl shadow-2xl transform transition-all animate-slide-in-right"
                    style={{
                        borderLeftColor: notif.type === 'incoming' ? '#00E5FF' : '#10B981',
                        boxShadow: notif.type === 'incoming' ? '-4px 0 20px rgba(0, 229, 255, 0.1)' : '-4px 0 20px rgba(16, 185, 129, 0.1)'
                    }}
                >
                    <div className="flex-1">
                        <h4 className="text-white text-sm font-bold tracking-wider mb-1 flex items-center gap-2">
                            {notif.type === 'incoming' ? (
                                <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
                            ) : (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            )}
                            {notif.title}
                        </h4>
                        <p className="text-zinc-400 text-xs font-mono">{notif.message}</p>
                    </div>
                    <button
                        onClick={() => removeNotification(notif.id)}
                        className="text-zinc-500 hover:text-white transition-colors p-1"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
}