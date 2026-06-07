"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BackgroundNet } from '@/components/layout/BackgroundNet';

import { API_URL } from '@/lib/utils';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isAutoLoggedIn, setIsAutoLoggedIn] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Sync with our backend
        const apiUrl = API_URL;
        await fetch(`${apiUrl}/users/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authId: data.user.id,
            email: data.user.email,
            name: fullName,
          }),
        });

        // Check if session is already active (email confirmation is off)
        if (data.session) {
          setIsAutoLoggedIn(true);
          setSuccess(true);
          setTimeout(() => {
            router.push('/analyzer');
          }, 1500);
          return;
        }

        // Email confirmation is on, or session was not returned.
        // Let's attempt automatic login using the typed credentials
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (!signInError && signInData.session) {
            setIsAutoLoggedIn(true);
            setSuccess(true);
            setTimeout(() => {
              router.push('/analyzer');
            }, 1500);
            return;
          }
        } catch (signInErr) {
          console.warn("Automatic sign-in failed:", signInErr);
        }

        // Fallback if auto sign-in failed (email confirmation is actually required)
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#040406] flex items-center justify-center p-6 relative">
        <BackgroundNet />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center glass p-10 rounded-3xl border border-[#ff007f]/20"
        >
          <div className="w-20 h-20 bg-[#ff007f]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#ff007f]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 font-display">
            {isAutoLoggedIn ? "Welcome to HireReady.AI!" : "Account Created!"}
          </h1>
          <p className="text-zinc-400 mb-8">
            {isAutoLoggedIn 
              ? "Logging you in automatically..." 
              : "Check your email to verify your account. Redirecting to login..."}
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-[#ff007f] mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040406] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <BackgroundNet />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tighter mb-4 font-display">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#ff007f] to-[#a855f7] flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,0,127,0.4)]">
              <span className="text-white text-lg font-extrabold">H</span>
            </div>
            <span className="text-white">HireReady<span className="text-[#ff007f]">.AI</span></span>
          </Link>
          <h1 className="text-3xl font-extrabold text-white font-display">Join HireReady</h1>
          <p className="text-zinc-400 mt-2">Start your journey to a better career today</p>
        </div>

        <div className="glass rounded-3xl p-8 border border-white/5">
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-[#0c0c0c]/60 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-[#ff007f]/30 focus:border-[#ff007f] outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#0c0c0c]/60 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-[#ff007f]/30 focus:border-[#ff007f] outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#0c0c0c]/60 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-[#ff007f]/30 focus:border-[#ff007f] outline-none transition-all"
                  placeholder="Minimum 6 characters"
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl p-3 flex items-center gap-2 text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-[#ff007f]/95 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed btn-hover shadow-[0_0_20px_rgba(255,0,127,0.4)]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-zinc-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-[#ff007f] font-semibold hover:text-[#ff007f]/85 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
