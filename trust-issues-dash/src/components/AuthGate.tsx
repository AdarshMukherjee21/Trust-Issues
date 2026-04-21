"use client";

import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import LightRays from "@/components/LightRays";
import {
  subscribeToAuthChanges,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  verifyUserEmail,
  checkEmailVerification,
  logOut,
} from "@/app/lib/auth_service";
import { createUserProfile, getUserProfile } from "@/app/lib/user_service";

type AuthGateProps = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isAwaitingVerification, setIsAwaitingVerification] = useState(false);
  const [bypassVerification, setBypassVerification] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      // If user logs in and is not verified, show verification screen
      if (currentUser && !currentUser.emailVerified) {
        setIsAwaitingVerification(true);
      } else {
        setIsAwaitingVerification(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        // Password Quality Checks
        if (password.length < 8) {
          setError("Password is too weak. It must be at least 8 characters long.");
          return;
        }
        if (!/(?=.*[0-9])/.test(password)) {
          setError("Password is too weak. It must contain at least one number.");
          return;
        }
        if (!/(?=.*[A-Z])/.test(password)) {
          setError("Password is too weak. It must contain at least one uppercase letter.");
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        // Sign up
        const newUser = await signUpWithEmail(email, password);
        if (newUser) {
          try {
            await createUserProfile(newUser.uid, username, name, age);
          } catch (e) {
            console.error("Failed to create user profile in Firestore:", e);
          }
          try {
            await verifyUserEmail(newUser);
          } catch (e) {
            console.error("Failed to implicitly send verification email:", e);
          }
          setIsAwaitingVerification(true);
          setMessage("Account created. Verification email sent! Check your inbox.");
        }
      }
    } catch (err: any) {
      const code = err.code || "";
      if (code === "auth/email-already-in-use") setError("This email is already registered. Please sign in.");
      else if (code === "auth/invalid-email") setError("Please enter a valid email address.");
      else if (code === "auth/weak-password") setError("Password is too weak.");
      else if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") setError("Incorrect email or password.");
      else if (code === "auth/too-many-requests") setError("Too many attempts. Please try again later.");
      else setError(err.message || "An unexpected error occurred");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      const user = await signInWithGoogle();
      if (user) {
        // Automatically provision a default profile if the user doesn't already have one
        const profile = await getUserProfile(user.uid);
        if (!profile) {
          await createUserProfile(user.uid, user.displayName?.replace(/\s/g, "") || "GoogleUser", user.displayName || "Unknown", "N/A");
        }
      }
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") return;
      setError(err.message || "An error occurred");
    }
  };

  const handleSendVerification = async () => {
    if (user) {
      try {
        setError("");
        await verifyUserEmail(user);
        setMessage("Verification email sent! Check your inbox.");
      } catch (err: any) {
        setError(err.message || "Error sending verification email.");
      }
    }
  };

  const handleCheckVerification = async () => {
    if (user) {
      try {
        setError("");
        setMessage("");
        const isVerified = await checkEmailVerification(user);
        if (isVerified) {
          setIsAwaitingVerification(false);
          setMessage("Email successfully verified!");
        } else {
          setError("Email not verified yet. Please check your inbox or resend.");
        }
      } catch (err: any) {
        setError(err.message || "Error checking verification status.");
      }
    }
  };

  const handleLogout = async () => {
    await logOut();
    setIsAwaitingVerification(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-zinc-400 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If we have a verified user, render children
  if (user && (!isAwaitingVerification || bypassVerification)) {
    return <>{children}</>;
  }

  // Auth Screen Output
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-sans relative overflow-hidden">
      {/* Light Rays Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <LightRays
          className="w-full h-full"
          raysColor="#a855f7"
          raysOrigin="top-center"
          lightSpread={1.5}
          rayLength={1.5}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-black to-emerald-900/10 pointer-events-none z-[1]" />
      
      <div className="relative z-10 w-full max-w-md p-8 bg-transparent backdrop-blur-3xl border border-white/20 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(168,85,247,0.3)]">
        <div className="mb-8 text-center">
          <p className="text-emerald-400 font-bold tracking-[0.2em] text-xs uppercase mb-3">Welcome to Trust Issues</p>
          <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
            {user && isAwaitingVerification 
              ? "Verify Email" 
              : isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-sm text-zinc-400 mt-2">
            {user && isAwaitingVerification 
              ? "Secure your account"
              : isLogin ? "Sign in to continue" : "Join Trust Issues today"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm font-medium">
            {message}
          </div>
        )}

        {user && isAwaitingVerification ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-300 text-center mb-2 px-4 leading-relaxed">
              We need to verify your email address to continue. Check your inbox for the link.
            </p>
            <button 
              onClick={handleSendVerification}
              className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-500 transition-all rounded-xl font-medium shadow-lg shadow-purple-500/20 active:scale-[0.98]"
            >
              Wait, send it again!
            </button>
            <button 
              onClick={handleCheckVerification}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 transition-all rounded-xl font-medium shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
            >
              I've Verified My Email
            </button>
            <button 
              onClick={() => setBypassVerification(true)}
              className="w-full py-3.5 px-4 bg-black/50 hover:bg-zinc-800 transition-all border border-white/10 rounded-xl font-medium text-white active:scale-[0.98]"
            >
              I'll verify later
            </button>
            <div className="h-px w-full bg-white/10 my-2" />
            <button 
              onClick={handleLogout}
              className="w-full py-3 px-4 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              Sign out and try another account
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="flex flex-col gap-5">
            <div className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Username</label>
                    <input 
                      type="text" 
                      required 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. shadowhacker99"
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-white placeholder:text-zinc-600"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-white placeholder:text-zinc-600"
                      />
                    </div>
                    <div className="w-1/3">
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Age</label>
                      <input 
                        type="number" 
                        required 
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="18"
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-white placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3.5 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-white placeholder:text-zinc-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isLogin ? "Enter your password" : "Create a password"}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-white placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      required 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-white placeholder:text-zinc-600"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <button 
              type="submit"
              className="w-full py-3.5 px-4 bg-white text-black hover:bg-zinc-200 transition-all rounded-xl font-semibold mt-2 shadow-xl shadow-white/10 active:scale-[0.98]"
            >
              {isLogin ? "Sign In" : "Create Account"}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-black/20 backdrop-blur-md rounded-full text-zinc-400">Or continue with</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-white/5 transition-all text-white rounded-xl font-medium flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            <div className="text-center mt-2 text-sm text-zinc-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(""); setMessage(""); }}
                className="text-white hover:text-purple-400 transition-colors font-medium ml-1"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
