"use client";

import { useEffect, useState } from "react";
import { FileText, Target, Clock, Activity, BarChart2 } from "lucide-react";
import Link from "next/link";
import { useCareerStore } from "@/store/careerStore";
import { useAuthSync } from "@/hooks/useAuthSync";
import { motion } from "framer-motion";
import { getApiUrl } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuthSync();
  const { dashboardData, setDashboardData } = useCareerStore();
  const [loading, setLoading] = useState(!dashboardData);

  useEffect(() => {
    async function fetchDashboard() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(getApiUrl(`/users/${user.id}/dashboard`));
        if (res.ok) {
          const updatedData = await res.json();
          setDashboardData(updatedData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [user?.id]); // user?.id is a stable primitive — prevents re-fetch on every auth heartbeat

  if (loading && !dashboardData) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-1/3 bg-slate-900 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-slate-900 rounded-3xl" />
          <div className="h-48 bg-slate-900 rounded-3xl" />
          <div className="h-48 bg-slate-900 rounded-3xl" />
        </div>
        <div className="h-64 bg-slate-900 rounded-3xl" />
      </div>
    );
  }

  const resumes = dashboardData?.resumes || [];

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
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, <span className="text-blue-500">{user?.user_metadata?.full_name?.split(' ')[0] || 'User'}</span></h1>
        <p className="text-slate-400">Here's an overview of your resume optimization journey.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-start hover:border-blue-500/50 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400 relative z-10">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1 relative z-10">Resume Analyzer</h3>
          <p className="text-sm text-slate-400 mb-4 flex-1 relative z-10">Get instant AI-driven feedback to optimize for ATS systems.</p>
          <Link href="/analyzer" className="text-blue-400 font-medium text-sm flex items-center hover:text-blue-300 relative z-10">
            Start Analysis &rarr;
          </Link>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-start hover:border-indigo-500/50 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400 relative z-10">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1 relative z-10">Job Matcher</h3>
          <p className="text-sm text-slate-400 mb-4 flex-1 relative z-10">Paste a JD and instantly see how well you match the role.</p>
          <Link href="/job-match" className="text-indigo-400 font-medium text-sm flex items-center hover:text-indigo-300 relative z-10">
            Find Matches &rarr;
          </Link>
        </div>

        {/* Stats Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-start relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
            <BarChart2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Your Stats</h3>
          <div className="mt-2 space-y-2 w-full">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Resumes Analyzed</span>
              <span className="text-white font-bold">{totalAnalyzed}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Avg ATS Score</span>
              <span className="text-white font-bold">{latestReport?.score ? `${latestReport.score}%` : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold text-white mb-6">Recent History</h2>
        {resumes.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
            <p className="text-slate-400">No resumes analyzed yet. Start your first analysis!</p>
            <Link href="/analyzer" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
              Analyze Resume
            </Link>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="divide-y divide-slate-800">
              {resumes.map((resume: any) => {
                const report = resume.analyses?.[0];
                return (
                  <div key={resume.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{resume.originalName || 'Uploaded Resume'}</p>
                      <p className="text-xs text-slate-500">{new Date(resume.createdAt).toLocaleDateString()}</p>
                    </div>
                    {report && (
                      <div className="text-right">
                        <div className={`text-sm font-bold ${report.score >= 80 ? 'text-green-400' : report.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {report.score}% Match
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
