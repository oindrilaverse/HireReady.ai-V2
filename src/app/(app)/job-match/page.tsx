"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Target, Search, CheckCircle2, XCircle, ChevronRight, Activity, Zap } from "lucide-react";

import { useAuthSync } from "@/hooks/useAuthSync";
import { useCareerStore } from "@/store/careerStore";
import { API_URL } from "@/lib/utils";

export default function JobMatchPage() {
  const { user } = useAuthSync();
  const { dashboardData } = useCareerStore();
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [suggestedJobs, setSuggestedJobs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fetchedForResumeId = useRef<string | null>(null);

  useEffect(() => {
    async function fetchSuggestions() {
      const latestResume = dashboardData?.resumes?.[0];
      if (!latestResume) return;
      if (fetchedForResumeId.current === latestResume.id) return;
      
      fetchedForResumeId.current = latestResume.id;
      setSuggestedLoading(true);
      try {
        const res = await fetch(`${API_URL}/jobs/suggested/${latestResume.id}`);
        if (res.ok) {
          const envelope = await res.json();
          if (envelope.success && envelope.data) {
            setSuggestedJobs(envelope.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      } finally {
        setSuggestedLoading(false);
      }
    }

    if (dashboardData) {
      fetchSuggestions();
    }
  }, [dashboardData]);


  const handleMatch = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste a job description.");
      return;
    }

    if (!user) {
      setError("Please sign in.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const latestResume = dashboardData?.resumes?.[0];
      if (!latestResume) {
        throw new Error("No resume found. Please upload and analyze a resume first.");
      }

      const matchRes = await fetch(`${API_URL}/jobs/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: latestResume.id,
          jobDescription: jobDescription,
        }),
      });

      const envelope = await matchRes.json();
      if (!matchRes.ok || !envelope.success) {
        throw new Error((envelope.error && envelope.error.message) || "Failed to match job");
      }

      const matchData = envelope.data;
      setResult({
        score: matchData.matchScore,
        feedback: typeof matchData.feedback === 'string' ? JSON.parse(matchData.feedback) : matchData.feedback,
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#10b981]";
    if (score >= 60) return "text-[#f59e0b]";
    return "text-[#ef4444]";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="text-center space-y-4 pt-8 mb-12">
        <div className="w-16 h-16 rounded-2xl bg-[#007bff]/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,123,255,0.2)] border border-[#007bff]/30">
          <Target className="w-8 h-8 text-[#007bff]" />
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          AI Job Matcher
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Paste the job description of your target role and see your exact compatibility based on your latest resume.
        </p>
      </header>

      {/* Suggested Jobs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {suggestedLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))
        ) : (
          suggestedJobs.map((job, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -4 }}
              className="glass p-6 rounded-2xl relative overflow-hidden group flex flex-col h-full border border-white/5"
            >
              <div className="absolute top-0 right-0 p-3">
                <span className={`text-[10px] font-bold text-white px-2.5 py-1 rounded-full shadow-lg ${job.matchScore >= 80 ? 'bg-[#10b981]' : job.matchScore >= 60 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'}`}>MATCH {job.matchScore}%</span>
              </div>
              <h4 className="font-bold text-white mb-1 pr-20 leading-tight">{job.title}</h4>
              <p className="text-xs text-zinc-400 mb-4">{job.company}</p>
              
              <div className="mb-6 flex-1">
                <p className="text-[10px] text-zinc-500 font-bold mb-2 uppercase tracking-wider">Missing Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.missingSkills?.map((skill: string, j: number) => (
                    <span key={j} className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{skill}</span>
                  ))}
                  {(!job.missingSkills || job.missingSkills.length === 0 || job.missingSkills[0] === "None") && (
                    <span className="text-[10px] bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] px-2 py-0.5 rounded-full">None</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-auto">
                <a 
                  href={job.applyLink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold bg-[#007bff] hover:bg-[#007bff]/95 text-white px-4 py-2 rounded-lg flex items-center justify-center flex-1 transition-all btn-hover"
                >
                  Apply Now
                </a>
                <button 
                  onClick={() => {
                    setJobDescription(`Job Role: ${job.title}\nCompany: ${job.company}`);
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }}
                  className="text-xs font-bold text-zinc-400 hover:text-[#007bff] flex items-center justify-center p-2 border border-white/10 hover:border-[#007bff]/50 hover:bg-[#007bff]/10 rounded-lg transition-all"
                  title="Detailed Match Analysis"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {!result && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#007bff]/5 blur-3xl rounded-full pointer-events-none" />
          
          <label className="block text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-[#007bff]" /> Job Description
          </label>
          <textarea 
            rows={12}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here (responsibilities, requirements, qualifications)..."
            className="w-full bg-[#0c0c0c]/60 border border-white/5 rounded-2xl p-6 text-zinc-300 placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-[#007bff]/30 resize-none transition-all"
          />
          
          {error && <p className="text-red-400 text-sm mt-4 font-medium">{error}</p>}
          
          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleMatch}
              className="bg-[#007bff] hover:bg-[#007bff]/95 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(0,123,255,0.4)] flex items-center gap-2 btn-hover"
            >
              Analyze Match <Zap className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 animate-pulse">
          <Activity className="w-12 h-12 text-[#007bff] animate-spin mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">Analyzing Compatibility...</h3>
          <p className="text-zinc-400">Comparing your skills with role requirements.</p>
        </div>
      )}

      {result && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex justify-between items-center mb-4">
             <button 
                onClick={() => { setResult(null); setJobDescription(""); }}
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10"
              >
                New Match <ChevronRight className="w-4 h-4" />
              </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Score Card */}
            <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[#007bff]/10 to-transparent" />
              <h3 className="text-zinc-400 font-semibold mb-6 uppercase tracking-wider text-sm relative z-10">Match Score</h3>
              <div className={`text-7xl font-extrabold tracking-tighter mb-4 ${getScoreColor(result.score)} relative z-10`}>
                {result.score}%
              </div>
              <p className="text-zinc-300 text-sm relative z-10">{result.feedback.summary}</p>
            </div>

            {/* Matching & Missing Skills */}
            <div className="md:col-span-2 space-y-6">
              <div className="glass rounded-3xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#10b981]" /> Matching Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.feedback.matchingSkills.map((skill: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="glass rounded-3xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-[#ef4444]" /> Missing Skills (Gap)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.feedback.missingSkills.map((skill: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-[#007bff]" /> Improvement Suggestions
            </h3>
            <ul className="space-y-4">
              {result.feedback.improvementSuggestions.map((suggestion: string, i: number) => (
                <li key={i} className="flex items-start gap-4 text-zinc-300 bg-[#0c0c0c]/40 p-4 rounded-xl border border-white/5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#007bff]/20 text-[#007bff] font-bold text-xs shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

        </motion.div>
      )}
    </div>
  );
}
