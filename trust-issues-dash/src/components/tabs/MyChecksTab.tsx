"use client";
import React, { useEffect, useState, useCallback } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase"; // Ensure correct path
import { getSubcollectionDocs } from "@/app/lib/user_service";
import { checkSms, checkEmail, explainMessage } from "@/app/lib/prediction_service";
import { reportThreat } from "@/app/lib/community_service"; // Import your community service

interface CheckItem {
  id: string;
  _type: "AI Ask" | "Email" | "SMS";
  timestamp: any;
  [key: string]: any;
}

export default function MyChecksTab({ uid }: { uid: string }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CheckItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CheckItem | null>(null);

  // --- NEW SCAN STATE ---
  const [isScanningNew, setIsScanningNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanType, setScanType] = useState<"SMS" | "Email">("SMS");
  const [scanForm, setScanForm] = useState({ sender: "", subject: "", message: "" });

  // --- AI EXPLAIN & COMMUNITY PUSH STATE ---
  const [isExplaining, setIsExplaining] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  // Extracted loadData so we can refresh the list quietly after a new scan
  const loadData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const ai = await getSubcollectionDocs(uid, "ai_asks");
      const email = await getSubcollectionDocs(uid, "email_checks");
      const sms = await getSubcollectionDocs(uid, "sms_checks");

      const mappedAi = ai.map(x => ({ ...x, _type: "AI Ask" }));
      const mappedEmail = email.map(x => ({ ...x, _type: "Email" }));
      const mappedSms = sms.map(x => ({ ...x, _type: "SMS" }));

      const combined = [...mappedAi, ...mappedEmail, ...mappedSms].sort((a, b) => {
        const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
        const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
        return (!isNaN(timeB) ? timeB : 0) - (!isNaN(timeA) ? timeA : 0);
      }) as CheckItem[];

      setItems(combined);

      // If we just loaded and there's no selected item, select the first one
      if (combined.length > 0 && showSpinner) {
        setSelectedItem(combined[0]);
      } else if (!showSpinner && combined.length > 0) {
        // If we did a quiet refresh, re-select the top item (assuming it's the newest)
        setSelectedItem(combined[0]);
      }
    } catch (e) {
      console.error("Error loading checks", e);
    }
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // --- HANDLERS ---
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanForm.message.trim()) return;

    setIsSubmitting(true);
    try {
      if (scanType === "SMS") {
        await checkSms(uid, scanForm.sender, scanForm.message);
      } else {
        await checkEmail(uid, scanForm.sender, scanForm.subject, scanForm.message);
      }

      // Reset form and refresh list
      setScanForm({ sender: "", subject: "", message: "" });
      setIsScanningNew(false);
      await loadData(false); // Quiet reload
    } catch (error) {
      console.error("Failed to run scan:", error);
      alert("Failed to analyze threat. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExplainRequest = async () => {
    if (!selectedItem || isExplaining) return;

    setIsExplaining(true);
    try {
      const source = selectedItem._type === "Email" ? "email" : "sms";

      await explainMessage(
        uid,
        source,
        selectedItem.id,
        selectedItem.subject || null,
        selectedItem.message,
        selectedItem.prediction
      );

      await loadData(false); // Quiet reload to get the new AI Ask in the list
    } catch (error) {
      console.error("Failed to fetch explanation:", error);
      alert("Failed to generate AI explanation.");
    } finally {
      setIsExplaining(false);
    }
  };

  // --- NEW: PUSH TO COMMUNITY HANDLER ---
  const handlePushToCommunity = async () => {
    if (!selectedItem || isPushing) return;

    setIsPushing(true);
    try {
      // 1. Format the threat text (combine subject + body for emails)
      const threatText = selectedItem._type === "Email"
        ? `${selectedItem.subject ? selectedItem.subject + "\n\n" : ""}${selectedItem.message}`
        : selectedItem.message;

      // 2. Call local Ngrok backend to push to Neo4j (this auto-checks if backend is active)
      await reportThreat({
        reporter_uid: uid,
        threat_text: threatText,
        threat_type: selectedItem.detailed_spam_type || selectedItem.prediction || "SPAM", // Ensure fallback
        sender_contact: selectedItem.sender || "Unknown Sender",
        sender_platform: selectedItem._type
      });

      // 3. If successful, update Firestore so the button hides
      const collectionName = selectedItem._type === "Email" ? "email_checks" : "sms_checks";
      const docRef = doc(db, "users", uid, collectionName, selectedItem.id);

      await updateDoc(docRef, {
        pushed_to_community: true
      });

      // 4. Silently reload to update UI state
      await loadData(false);

    } catch (error: any) {
      console.error("Failed to push to community:", error);
      alert(error.message || "Failed to push to community graph. Make sure the backend is online.");
    } finally {
      setIsPushing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 lg:p-24 w-full min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-zinc-400 font-medium tracking-wide animate-pulse">Decrypting history stream...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">

      {/* LEFT PANE - List of Checks */}
      <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 pb-24 custom-scrollbar">
        <div className="flex justify-between items-center mb-4 pl-2 pr-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">My Checks</h2>

          {/* THE NEW "+" BUTTON */}
          <button
            onClick={() => {
              setIsScanningNew(true);
              setSelectedItem(null);
            }}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all border border-white/10 hover:border-white/30 hover:scale-105 active:scale-95 shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {items.length === 0 && !isScanningNew && (
          <div className="bg-black/20 border border-dashed border-white/10 p-6 rounded-2xl text-center">
            <p className="text-zinc-500 text-sm font-medium">No checks found. Click the + to scan.</p>
          </div>
        )}

        {items.map((item, idx) => (
          <button
            key={item.id || idx}
            onClick={() => {
              setSelectedItem(item);
              setIsScanningNew(false); // Close scan form if open
            }}
            className={`text-left w-full relative overflow-hidden rounded-2xl p-6 py-8 transition-all duration-300 border ${selectedItem?.id === item.id && !isScanningNew
              ? 'bg-zinc-900 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)] scale-[1.02]'
              : 'bg-black/40 border-white/5 hover:bg-zinc-900/50 hover:border-white/10'
              }`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item._type === 'AI Ask' ? 'bg-purple-500' : item._type === 'Email' ? 'bg-emerald-500' : 'bg-sky-500'}`} />

            <div className="flex justify-between items-start pl-4 mb-3">
              <span className="text-xs font-bold tracking-widest uppercase text-zinc-400 bg-white/5 px-3 py-1 rounded-md border border-white/5">
                {item._type}
              </span>
              <span className="text-xs text-zinc-500 font-bold">
                {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
              </span>
            </div>

            <div className="pl-4">
              <p className="text-sm font-bold text-white line-clamp-2 leading-snug mb-2">
                {item._type === 'AI Ask' ? item.original_text : (item.subject || item.message)}
              </p>
              {item.sender && (
                <p className="text-xs text-zinc-500 truncate font-mono bg-black/40 inline-block px-2 py-1 rounded border border-white/5">
                  {item.sender}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* RIGHT PANE - Expanded Details OR New Scan Form */}
      <div className="flex-1 h-full mb-24 lg:mb-0 min-w-0">

        {/* NEW SCAN FORM VIEW */}
        {isScanningNew ? (
          <div className="h-full bg-zinc-950/80 border border-white/10 rounded-[2rem] p-8 lg:p-10 shadow-2xl relative overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Run Security Scan</h3>
                <p className="text-zinc-500 text-sm">Analyze a suspicious message with the AI engine.</p>
              </div>
            </div>

            <form onSubmit={handleScanSubmit} className="flex flex-col gap-6">
              {/* Type Toggle */}
              <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 w-max">
                <button
                  type="button"
                  onClick={() => setScanType("SMS")}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${scanType === "SMS" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-white"}`}
                >
                  SMS / Text
                </button>
                <button
                  type="button"
                  onClick={() => setScanType("Email")}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${scanType === "Email" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-white"}`}
                >
                  Email
                </button>
              </div>

              {/* Inputs */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Sender (Optional)</label>
                <input
                  type="text"
                  value={scanForm.sender}
                  onChange={(e) => setScanForm({ ...scanForm, sender: e.target.value })}
                  placeholder={scanType === "SMS" ? "+91 98765 00000" : "scam@example.com"}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>

              {scanType === "Email" && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Subject</label>
                  <input
                    type="text"
                    value={scanForm.subject}
                    onChange={(e) => setScanForm({ ...scanForm, subject: e.target.value })}
                    placeholder="e.g. URGENT: Account Locked"
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2 flex-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Raw Message *</label>
                <textarea
                  required
                  value={scanForm.message}
                  onChange={(e) => setScanForm({ ...scanForm, message: e.target.value })}
                  placeholder="Paste the exact text of the suspicious message here..."
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:border-purple-500/50 transition-colors min-h-[150px] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !scanForm.message.trim()}
                className="mt-4 w-full bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 py-4 rounded-xl font-bold tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black disabled:border-t-zinc-400 rounded-full animate-spin" />
                    Analyzing Payload...
                  </>
                ) : (
                  "Execute Threat Scan"
                )}
              </button>
            </form>
          </div>
        ) : selectedItem ? (
          /* DETAILS VIEW */
          <div className="h-full bg-zinc-950/80 border border-white/10 rounded-[2rem] p-8 lg:p-10 shadow-2xl relative overflow-y-auto custom-scrollbar flex flex-col">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <span className={`text-sm font-bold tracking-[0.2em] uppercase px-5 py-2 rounded-full w-max ${selectedItem._type === 'AI Ask' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : selectedItem._type === 'Email' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'}`}>
                {selectedItem._type} Analysis
              </span>
              <span className="text-sm font-bold text-zinc-500 bg-black/40 px-4 py-2 rounded-full border border-white/5 w-max">
                {selectedItem.timestamp?.seconds ? new Date(selectedItem.timestamp.seconds * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : String(selectedItem.timestamp)}
              </span>
            </div>

            {/* AI ASK LAYOUT */}
            {selectedItem._type === "AI Ask" && (
              <div className="flex flex-col gap-8 flex-1">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-3">Original Prompt</h4>
                  <div className="bg-black/50 border border-white/5 rounded-2xl p-6">
                    <p className="text-zinc-300 italic leading-relaxed text-lg">"{selectedItem.original_text}"</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                    AI Conclusion
                  </h4>
                  <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-8">
                    <p className="text-white font-medium leading-relaxed text-lg">{selectedItem.ai_explanation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* EMAIL / SMS LAYOUT */}
            {(selectedItem._type === "Email" || selectedItem._type === "SMS") && (
              <div className="flex flex-col gap-8 flex-1">
                <div className="flex flex-col gap-3 bg-black/50 border border-white/5 p-6 rounded-2xl">
                  {selectedItem.sender && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Sender</span>
                      <span className="text-white font-mono text-sm bg-white/5 px-4 py-2 rounded-lg border border-white/5">{selectedItem.sender}</span>
                    </div>
                  )}
                  {selectedItem.subject && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 pt-4 border-t border-white/5">
                      <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Subject</span>
                      <span className="text-white text-base font-medium sm:text-right">{selectedItem.subject}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-3">Intercepted Message</h4>
                  <div className="bg-black/50 border border-white/5 rounded-2xl p-8 relative group">
                    <svg className="absolute -top-3 -left-3 w-10 h-10 text-zinc-700 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21L16.096 11.516H11.53M14.017 21H11.53L13.609 11.516M14.017 21L13.609 11.516" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4.017 21L6.096 11.516H1.53M4.017 21H1.53L3.609 11.516M4.017 21L3.609 11.516" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-zinc-200 leading-relaxed font-medium relative z-10 pl-2 text-lg">"{selectedItem.message}"</p>
                  </div>
                </div>

                <div className="mt-auto pt-8 border-t border-white/10 flex flex-col gap-6">

                  {/* Status Badges */}
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Threat Status</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide uppercase ${selectedItem.prediction === 'SPAM' || selectedItem.prediction === 'PHISHING' ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {selectedItem.detailed_spam_type || selectedItem.prediction}
                      </span>
                      {selectedItem.pushed_to_community && (
                        <span className="px-5 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          Shared to Graph
                        </span>
                      )}
                    </div>
                  </div>

                  {/* PUSH TO COMMUNITY BUTTON (Only if SPAM/PHISHING and not yet pushed) */}
                  {(selectedItem.prediction === 'SPAM' || selectedItem.prediction === 'PHISHING') && !selectedItem.pushed_to_community && (
                    <button
                      onClick={handlePushToCommunity}
                      disabled={isPushing}
                      className="w-full bg-gradient-to-r from-red-500/20 to-transparent hover:from-red-500/40 border border-red-500/30 text-red-400 py-4 rounded-xl font-bold tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                    >
                      {isPushing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin" />
                          Uploading to Graph...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Push to Community Graph
                        </>
                      )}
                    </button>
                  )}

                  {/* EXPLAIN ACTION BUTTON (Only shows if it hasn't been explained yet) */}
                  {!selectedItem.ai_explanation_ref && (
                    <button
                      onClick={handleExplainRequest}
                      disabled={isExplaining}
                      className="w-full bg-gradient-to-r from-purple-600/20 to-transparent hover:from-purple-600/40 border border-purple-500/30 text-purple-300 py-4 rounded-xl font-bold tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                    >
                      {isExplaining ? (
                        <>
                          <div className="w-5 h-5 border-2 border-purple-400/20 border-t-purple-400 rounded-full animate-spin" />
                          Consulting AI Engine...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Ask AI for Detailed Breakdown
                        </>
                      )}
                    </button>
                  )}

                  {/* If it HAS been explained, show a link indicator */}
                  {selectedItem.ai_explanation_ref && (
                    <div className="px-4 py-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">AI Analysis Logged in History</span>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-black/20 rounded-[2rem] border border-white/5 border-dashed">
            <p className="text-zinc-500 font-bold text-lg tracking-wide">Select a check from the left to view details</p>
          </div>
        )}
      </div>

    </div>
  );
}