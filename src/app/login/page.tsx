"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { BackgroundNet } from '@/components/layout/BackgroundNet';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Do NOT call router.refresh() here — it races against Supabase cookie
      // propagation and lets middleware briefly see no session, bouncing back to /login.
      // router.push() alone is sufficient; the middleware will see the session on next load.
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-extrabold text-white font-display">Welcome Back</h1>
          <p className="text-zinc-400 mt-2">Enter your credentials to access your dashboard</p>
        </div>

        <div className="glass rounded-3xl p-8 border border-white/5">
          <form onSubmit={handleLogin} className="space-y-5">
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-300">Password</label>
                <Link href="#" className="text-xs text-[#ff007f] hover:text-[#ff007f]/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#0c0c0c]/60 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white focus:ring-2 focus:ring-[#ff007f]/30 focus:border-[#ff007f] outline-none transition-all"
                  placeholder="••••••••"
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
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-zinc-400 text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="text-[#ff007f] font-semibold hover:text-[#ff007f]/80 transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
