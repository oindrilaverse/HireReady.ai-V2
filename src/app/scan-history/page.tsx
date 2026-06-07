"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart2, Clock, FileText, TrendingUp, RefreshCw, LogIn } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { ScanHistoryCard } from "@/components/ScanHistoryCard";
import dynamic from "next/dynamic";

const ScoreChart = dynamic(
  () => import("@/components/ScoreChart").then((mod) => mod.ScoreChart),
  { ssr: false }
);

interface ScanRow {
  id: string;
  user_id: string;
  created_at: string;
  ats_score: number;
  job_title: string | null;
  skills_matched: string | null;
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/5" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-white/5" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

export default function ScanHistoryPage() {
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("there");
  const [tier, setTier] = useState<string>("free");
  const [scanCount, setScanCount] = useState<number>(0);

  const supabase = createClient();

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError("not_authed");
        setLoading(false);
        return;
      }

      const uid = session.user.id;
      setUserName(
        session.user.user_metadata?.full_name?.split(" ")[0] ||
        session.user.email?.split("@")[0] ||
        "there"
      );

      const { data: userRow } = await supabase
        .from("users")
        .select("tier, scan_count")
        .eq("auth_id", uid)
        .maybeSingle();

      if (userRow) {
        setTier(userRow.tier ?? "free");
        setScanCount(userRow.scan_count ?? 0);
      }

      const { data: historyRows, error: histErr } = await supabase
        .from("scan_history")
        .select("id, user_id, created_at, ats_score, job_title, skills_matched")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(50);

      if (histErr) throw histErr;
      setScans(historyRows ?? []);
    } catch (err: unknown) {
      console.error("[ScanHistory] load error:", err);
      setError("Failed to load your data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loading && error === "not_authed") {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-10 text-center max-w-sm w-full border border-white/5"
        >
          <LogIn className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sign in required</h2>
          <p className="text-gray-400 text-sm mb-6">Please log in to view your scan history.</p>
          <Link
            href="/login"
            className="inline-block bg-primary hover:bg-[#ff007f]/90 text-white font-semibold py-2.5 px-8 rounded-xl transition-all"
          >
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  const avgScore = scans.length
    ? Math.round(scans.reduce((acc, s) => acc + s.ats_score, 0) / scans.length)
    : 0;
  const bestScore = scans.length ? Math.max(...scans.map((s) => s.ats_score)) : 0;
  const scansLeft = tier === "free" ? Math.max(0, 3 - scanCount) : "∞";

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,0,127,0.08) 0%, transparent 60%)" }}
      />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Scan History</h1>
            <p className="text-gray-400 mt-1 text-sm">
              Welcome back, <span className="text-primary font-semibold">{userName}</span>. Here's your resume scan history.
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 border border-white/10 px-4 py-2 rounded-xl transition-all hover:bg-white/10 disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </header>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Skeleton />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-10 text-center border border-red-500/20 bg-red-500/5"
            >
              <p className="text-red-400 mb-4">{error}</p>
              <button onClick={loadData} className="bg-primary hover:bg-[#ff007f]/90 text-white font-semibold py-2 px-6 rounded-xl transition-all">
                Try Again
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* KPI Cards */}
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  {
                    icon: FileText,
                    label: "Total Scans Used",
                    value: scanCount,
                    sub: tier === "free" ? `${scansLeft} free scan${scansLeft === 1 ? "" : "s"} left` : "Pro — unlimited",
                    color: "text-primary",
                    bg: "bg-primary/10",
                    border: "border-primary/20",
                  },
                  {
                    icon: TrendingUp,
                    label: "Average ATS Score",
                    value: scans.length ? `${avgScore}` : "—",
                    sub: scans.length ? `across ${scans.length} scan${scans.length === 1 ? "" : "s"}` : "No scans yet",
                    color: avgScore >= 80 ? "text-emerald-400" : avgScore >= 60 ? "text-amber-400" : "text-red-400",
                    bg: "bg-white/5",
                    border: "border-white/10",
                  },
                  {
                    icon: BarChart2,
                    label: "Best ATS Score",
                    value: scans.length ? `${bestScore}` : "—",
                    sub: scans.length ? "personal best" : "Upload a resume to start",
                    color: bestScore >= 80 ? "text-emerald-400" : bestScore >= 60 ? "text-amber-400" : "text-gray-400",
                    bg: "bg-white/5",
                    border: "border-white/10",
                  },
                ].map((kpi, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`glass rounded-2xl p-5 border ${kpi.border} relative overflow-hidden`}
                  >
                    <div className={`w-9 h-9 ${kpi.bg} rounded-xl flex items-center justify-center mb-3 border ${kpi.border}`}>
                      <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">{kpi.label}</p>
                    <p className={`text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-xs text-gray-600 mt-1">{kpi.sub}</p>
                  </motion.div>
                ))}
              </section>

              {/* Score Chart */}
              <section className="glass rounded-2xl p-6 border border-white/5">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">ATS Score Over Time</h2>
                </div>
                <ScoreChart scans={scans} />
              </section>

              {/* History List */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Past Scans
                    {scans.length > 0 && (
                      <span className="ml-2 text-xs text-gray-600 normal-case font-normal">({scans.length} total)</span>
                    )}
                  </h2>
                </div>

                {scans.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass rounded-2xl p-12 text-center border border-white/5"
                  >
                    <FileText className="w-10 h-10 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No scans recorded yet.</p>
                    <p className="text-gray-600 text-sm mb-6">Upload a resume on the Analyzer page to see your history here.</p>
                    <Link href="/analyzer" className="inline-block bg-primary hover:bg-[#ff007f]/90 text-white font-semibold py-2.5 px-8 rounded-xl transition-all">
                      Go to Analyzer
                    </Link>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {scans.map((scan, i) => (
                      <ScanHistoryCard
                        key={scan.id}
                        index={i}
                        atsScore={scan.ats_score}
                        jobTitle={scan.job_title}
                        createdAt={scan.created_at}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Upgrade CTA */}
              {tier === "free" && scanCount >= 2 && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-6 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-white font-bold">You&apos;re almost at your free limit</p>
                    <p className="text-gray-400 text-sm mt-0.5">Upgrade to Pro for unlimited scans, priority AI, and full history.</p>
                  </div>
                  <button className="flex-shrink-0 bg-primary hover:bg-[#ff007f]/90 text-white font-semibold py-2.5 px-7 rounded-xl transition-all shadow-[0_0_20px_rgba(255,0,127,0.3)]">
                    Upgrade to Pro
                  </button>
                </motion.section>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
