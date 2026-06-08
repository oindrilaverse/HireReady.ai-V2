"use client";

import { useEffect, useState, useRef } from "react";
import { FileText, Target, Clock, Activity, BarChart2 } from "lucide-react";
import Link from "next/link";
import { useCareerStore } from "@/store/careerStore";
import { useAuthSync } from "@/hooks/useAuthSync";
import { motion } from "framer-motion";

import { API_URL } from "@/lib/utils";

export default function DashboardPage() {
  const { user, isSynced } = useAuthSync();
  const { dashboardData, setDashboardData } = useCareerStore();
  
  // Ensure the cached dashboard data belongs to the currently logged in user to avoid stale flash
  const isCorrectUser = dashboardData && user && (dashboardData.auth_id === user.id || dashboardData.id === user.id);
  const displayData = isCorrectUser ? dashboardData : null;
  
  // FIX 4: Only show loading state if we don't have valid cached data.
  // Show skeleton immediately — never block on a blank screen.
  const [loading, setLoading] = useState(!displayData);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    // FIX 4: Fire dashboard fetch as soon as we have user.id — do NOT wait for isSynced.
    // Previously: waited for POST /users/sync to complete (~7-8s) before even starting dashboard fetch.
    // Now: dashboard fetch fires the moment user.id is available from local session cache.
    // The sync completes in the background without blocking the data fetch.
    // The backend's /dashboard endpoint only needs auth_id which we have immediately.
    if (!user?.id) return;
    
    // Prevent duplicate fetches for the same user
    if (fetchedRef.current === user.id) return;
    fetchedRef.current = user.id;

    async function fetchDashboard() {
      try {
        const res = await fetch(`${API_URL}/users/${user!.id}/dashboard`);
        if (res.ok) {
          const envelope = await res.json();
          if (envelope.success && envelope.data) {
            setDashboardData(envelope.data);
          } else {
            setDashboardData(envelope);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [user?.id, setDashboardData]);

  // Clear loading when displayData becomes available (e.g. from cache)
  useEffect(() => {
    if (displayData) {
      setLoading(false);
    }
  }, [displayData]);

  if (loading && !displayData) {
    return (
      <div className="space-y-8">
        <header className="mb-8 space-y-3">
          <div className="h-10 w-1/3 skeleton rounded-xl" />
          <div className="h-5 w-1/2 skeleton rounded-lg" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 skeleton rounded-2xl" />
          <div className="h-48 skeleton rounded-2xl" />
          <div className="h-48 skeleton rounded-2xl" />
        </div>
        <div className="mt-12 space-y-4">
          <div className="h-8 w-1/4 skeleton rounded-lg" />
          <div className="h-40 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  const resumes = displayData?.resumes || [];

  const totalAnalyzed = resumes.length;
  const latestResume = resumes[0];
  const latestReport = latestResume?.analyses?.[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 font-display">Welcome back, <span className="text-primary">{user?.user_metadata?.full_name?.split(' ')[0] || 'User'}</span></h1>
        <p className="text-zinc-400">Here's an overview of your resume optimization journey.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="glass glass-hover p-6 rounded-2xl flex flex-col items-start relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-300"></div>
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4 text-primary relative z-10">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1 relative z-10 font-display">Resume Analyzer</h3>
          <p className="text-sm text-zinc-400 mb-4 flex-1 relative z-10">Get instant AI-driven feedback to optimize for ATS systems.</p>
          <Link href="/analyzer" className="text-primary font-medium text-sm flex items-center hover:text-[#ff007f]/85 relative z-10 transition-colors">
            Start Analysis &rarr;
          </Link>
        </div>

        <div className="glass glass-hover p-6 rounded-2xl flex flex-col items-start relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-300"></div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center mb-4 text-purple-400 relative z-10">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1 relative z-10 font-display">Job Matcher</h3>
          <p className="text-sm text-zinc-400 mb-4 flex-1 relative z-10">Paste a JD and instantly see how well you match the role.</p>
          <Link href="/job-match" className="text-purple-400 font-medium text-sm flex items-center hover:text-purple-300 relative z-10 transition-colors">
            Find Matches &rarr;
          </Link>
        </div>

        <div className="glass glass-hover p-6 rounded-2xl flex flex-col items-start relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-300"></div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center mb-4 text-blue-400 relative z-10">
            <BarChart2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1 relative z-10 font-display">Analytics</h3>
          <p className="text-sm text-zinc-400 mb-4 flex-1 relative z-10">Track your ATS scores and resume performance over time.</p>
          <Link href="/analytics" className="text-blue-400 font-medium text-sm flex items-center hover:text-blue-300 relative z-10 transition-colors">
            View Analytics &rarr;
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-zinc-400 font-medium">Total Scans</span>
          </div>
          <p className="text-3xl font-bold text-white font-display">{totalAnalyzed}</p>
          <p className="text-xs text-zinc-500 mt-1">Resumes analyzed</p>
        </div>

        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-sm text-zinc-400 font-medium">Latest ATS Score</span>
          </div>
          <p className="text-3xl font-bold text-white font-display">
            {latestReport?.score != null ? `${latestReport.score}` : '—'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">{latestReport ? 'out of 100' : 'No analysis yet'}</p>
        </div>

        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-sm text-zinc-400 font-medium">Last Activity</span>
          </div>
          <p className="text-3xl font-bold text-white font-display">
            {latestResume?.createdAt
              ? new Date(latestResume.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : '—'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">{latestResume ? 'Last resume upload' : 'No activity yet'}</p>
        </div>
      </div>

      {/* Recent Scans */}
      <div className="mt-4">
        <h2 className="text-xl font-semibold text-white mb-4 font-display">Recent Scans</h2>
        {resumes.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary/60" />
            </div>
            <p className="text-zinc-400 text-lg font-medium mb-2">No resumes analyzed yet</p>
            <p className="text-zinc-500 text-sm mb-6">Upload your resume to get started with AI-powered ATS optimization.</p>
            <Link
              href="/analyzer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/85 transition-colors"
            >
              Analyze Resume
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.slice(0, 5).map((resume: any) => {
              const report = resume.analyses?.[0];
              const score = report?.score;
              const scoreColor = score != null
                ? score >= 80 ? 'text-emerald-400'
                : score >= 60 ? 'text-amber-400'
                : 'text-red-400'
                : 'text-zinc-500';
              return (
                <div key={resume.id} className="glass glass-hover p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary/70" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{resume.originalName || 'Resume'}</p>
                      <p className="text-zinc-500 text-xs">
                        {new Date(resume.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {score != null && (
                      <div className="text-right">
                        <p className={`text-lg font-bold font-display ${scoreColor}`}>{score}</p>
                        <p className="text-xs text-zinc-500">ATS Score</p>
                      </div>
                    )}
                    <Link
                      href="/analyzer"
                      className="text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Re-analyze
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
