import React, { useState } from 'react';
import { AuthUser } from '../types';
import { Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { SplineScene } from "./ui/splite";
import { Card } from "./ui/card";
import { Spotlight } from "./ui/spotlight";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { useGoogleLogin } from '@react-oauth/google';

interface LoginProps {
  onLogin: (user: AuthUser, googleToken?: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);
  const connectTimeout = React.useRef<number | null>(null);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("Google Login Success Callback", tokenResponse);
      if (connectTimeout.current) window.clearTimeout(connectTimeout.current);
      setIsConnecting(false);
      setShowTroubleshooter(false);

      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const data = await res.json();
        onLogin({
          email: data.email,
          name: data.name,
          picture: data.picture
        }, tokenResponse.access_token);
        alert("Success: Logged in via Google!");
      } catch (error) {
        console.error("Failed to fetch user info", error);
        alert("Error fetching user info: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    },
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send',
    onError: (errorResponse) => {
      console.error('Login Failed', errorResponse);
      setIsConnecting(false);
      if (connectTimeout.current) window.clearTimeout(connectTimeout.current);
      alert("Google Login Error: The popup closed or failed. \n\nIMPORTANT: Check your Google Console 'Authorized JavaScript Origins' contains: " + window.location.origin);
    },
  });

  const handleGoogleClick = () => {
    const clientId = (window as any).__GOOGLE_CLIENT_ID__ || "";
    if (!clientId) {
      alert("CRITICAL ERROR: VITE_GOOGLE_CLIENT_ID is missing! \n\nPlease add it to your Vercel Environment Variables.");
      return;
    }

    setIsConnecting(true);
    setShowTroubleshooter(false);

    // Safety Timeout: If Google doesn't respond in 15 seconds, show troubleshooter
    if (connectTimeout.current) window.clearTimeout(connectTimeout.current);
    connectTimeout.current = window.setTimeout(() => {
      if (isConnecting) {
        setShowTroubleshooter(true);
      }
    }, 15000);

    googleLogin();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Keep demo/manual login for fallback or specific testing if needed,
    // but ideally we want to encourage Google Sign In for the features.
    onLogin({ email, name: name || email.split('@')[0] });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 md:p-8 relative overflow-hidden">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />

      <Card className="w-full max-w-6xl h-auto md:h-[700px] bg-neutral-900/50 backdrop-blur-xl border-neutral-800 relative overflow-hidden shadow-2xl z-10">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left content - Login Form */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-950/30">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-6 shadow-xl shadow-indigo-500/20">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Leader A1</h1>
              <p className="text-neutral-400 mt-2">Compliance & ELD Automation Engine</p>
            </motion.div>


            <div className="flex flex-col gap-3 mb-8">
              <button
                onClick={() => handleGoogleClick()}
                className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-100 transition-all shadow-md active:scale-95"
              >
                <svg className={cn("w-5 h-5", isConnecting && "animate-spin")} viewBox="0 0 24 24">
                  {!isConnecting ? (
                    <>
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l2.84-2.84z" fill="#FBBC05" />
                      <path d="M12 4.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </>
                  ) : (
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  )}
                </svg>
                {isConnecting ? "Connecting to Google..." : "Sign in with Google"}
              </button>

              {showTroubleshooter && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[10px] text-amber-200 leading-relaxed shadow-lg"
                >
                  <p className="font-extrabold mb-1">⚠️ CONNECTION STALLED!</p>
                  <p>If the window says "One moment please", your browser is likely blocking <b>Third-party cookies</b> or an <b>Ad-Blocker</b> is active.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-white bg-amber-600 px-2 py-1 rounded font-bold hover:bg-amber-700 transition-colors"
                  >
                    REFRESH & TRY AGAIN
                  </button>
                </motion.div>
              )}

              <div className="flex items-center gap-3 text-xs text-neutral-500 uppercase font-bold">
                <div className="h-px bg-neutral-800 flex-1" />
                <span>Or using email / demo</span>
                <div className="h-px bg-neutral-800 flex-1" />
              </div>

              <button
                onClick={() => onLogin({ email: 'demo@leader-a1.com', name: 'Demo Admin' })}
                className="w-full py-2 bg-neutral-800 text-neutral-400 rounded-xl font-bold text-[10px] hover:bg-neutral-700 hover:text-white transition-all border border-neutral-700 active:scale-95"
              >
                SKIP GOOGLE (DEMO MODE)
              </button>
            </div>

            <div className="flex mb-8 bg-neutral-800 p-1 rounded-xl">
              <button
                onClick={() => setIsSignUp(false)}
                className={cn(
                  "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                  !isSignUp ? "bg-indigo-600 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"
                )}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={cn(
                  "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                  isSignUp ? "bg-indigo-600 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"
                )}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-neutral-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-white placeholder-neutral-600"
                      placeholder="Enter your name"
                    />
                  </div>
                </motion.div>
              )}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-white placeholder-neutral-600"
                    placeholder="admin@leader-a1.com"
                  />
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-neutral-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-white placeholder-neutral-600"
                    placeholder="••••••••"
                  />
                </div>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group"
              >
                {isSignUp ? 'Create Account' : 'Sign Into Dashboard'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </form>

            <div className="mt-8 text-center text-sm text-neutral-500">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-1 text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>

          {/* Right content - 3D Scene */}
          <div className="hidden md:block w-1/2 relative bg-neutral-950 overflow-hidden">
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-12 bg-gradient-to-t from-neutral-950 via-transparent to-transparent pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-4xl font-bold text-white mb-2">Automate Compliance.</h2>
                <p className="text-neutral-400 max-w-md">
                  Connect your ELD data source and let our AI-driven engine handle driver monitoring and notification.
                </p>
              </motion.div>
            </div>
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full opacity-60"
            />
          </div>
        </div>
      </Card>

      {/* Debug Footer for Production Setup */}
      <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-8 z-50">
        <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-lg p-3 text-[10px] font-mono text-neutral-400 shadow-2xl flex flex-col gap-1 max-w-[300px]">
          <div className="flex justify-between border-b border-neutral-800 pb-1 mb-1">
            <span className="font-bold text-neutral-300">SYSTEM HEALTH</span>
            <span className="text-indigo-400">v1.2.0-debug</span>
          </div>
          <div className="flex justify-between">
            <span>CLIENT ID:</span>
            <span className={(window as any).__GOOGLE_CLIENT_ID__ ? "text-green-500" : "text-red-500 font-bold"}>
              {(window as any).__GOOGLE_CLIENT_ID__ ? "LOADED" : "MISSING!"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 mt-1 pt-1 border-t border-neutral-800">
            <span className="text-[8px] uppercase font-bold text-neutral-500">Authorized Origin:</span>
            <span className="text-white bg-neutral-950 p-1 rounded truncate select-all">{window.location.origin}</span>
          </div>
          {!(window as any).__GOOGLE_CLIENT_ID__ && (
            <p className="text-red-400 mt-2 font-bold animate-pulse">
              ⚠️ Add VITE_GOOGLE_CLIENT_ID to Vercel!
            </p>
          )}

          <div className="mt-2 pt-2 border-t border-neutral-800">
            <p className="text-[9px] leading-tight text-amber-500/80">
              ⚠️ If Google hangs, disable Ad-Blockers and ensure "Third-party cookies" are allowed in Chrome settings.
            </p>
          </div>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -ml-64 -mb-64"></div>
    </div>
  );
};
