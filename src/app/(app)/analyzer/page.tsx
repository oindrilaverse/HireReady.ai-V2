"use client";

import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight, Award, Briefcase, FileWarning, SearchX, Target } from "lucide-react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCareerStore } from "@/store/careerStore";
import { getApiUrl } from "@/lib/utils";


interface AnalysisResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  suggestions: string[];
  formattingIssues: string[];
  rawText?: string;
}

import { useAuthSync } from "@/hooks/useAuthSync";

export default function AnalyzerPage() {
  const { user } = useAuthSync();
  const { setResumeText } = useCareerStore();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    const allowed = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const nameOk = /\.(pdf|txt|doc|docx)$/i.test(selectedFile.name);
    if (!allowed.includes(selectedFile.type) && !nameOk) {
      setError('Please upload a PDF, DOCX, or TXT file.');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    analyzeResume(selectedFile);
  };

  const analyzeResume = async (fileToAnalyze: File) => {
    if (!user) {
      setError("Please sign in to analyze resumes.");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', fileToAnalyze);
      formData.append('authId', user.id);
      if (user.email) formData.append('userEmail', user.email);
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
      if (name) formData.append('userName', name);

      // Step 1: Upload and Extract Text
      const uploadResponse = await fetch(getApiUrl("analyze/upload"), {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Failed to parse resume.");
      }

      const uploadData = await uploadResponse.json();
      
      if (uploadData.success === false) {
        throw new Error(uploadData.error || "Upload failed");
      }

      if (uploadData.rawText) {
        setResumeText(uploadData.rawText);
      }

      let reportData;

      // Check if it was a duplicate with an existing report
      if (uploadData.isDuplicate && uploadData.report) {
        reportData = uploadData.report;
      } else {
        // Step 2: Run AI Analysis Asynchronously
        const processResponse = await fetch(getApiUrl("analyze/process"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeId: uploadData.resumeId })
        });

        if (!processResponse.ok) {
          const errorData = await processResponse.json();
          throw new Error(errorData.error || "AI Analysis failed.");
        }

        const processData = await processResponse.json();
        if (processData.success === false) {
          throw new Error(processData.error || "AI Analysis failed.");
        }

        reportData = processData.report;
      }

      // Issue C fix: guard against null/undefined reportData before destructuring
      if (!reportData) {
        throw new Error("Analysis failed. Please try again.");
      }

      // Safely parse each array field — DB stores them as JSON strings; guard with || []
      const safeParse = (val: unknown): string[] => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch { return []; }
        }
        return [];
      };

      const analysisResult: AnalysisResult = {
        score: reportData.score ?? 0,
        summary: reportData.summary ?? 'No summary available.',
        strengths: safeParse(reportData.strengths),
        weaknesses: safeParse(reportData.weaknesses),
        missingKeywords: safeParse(reportData.missingKeywords),
        suggestions: safeParse(reportData.suggestions),
        formattingIssues: safeParse(reportData.formattingIssues),
        rawText: uploadData.rawText,
      };

      setResult(analysisResult);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during analysis.";
      console.error("Analysis failed error details:", err);

      // Check if it's a critical system/network error (e.g., CORS, offline, or JSON parse error)
      const isSystemError = 
        errorMessage.includes("Failed to fetch") || 
        errorMessage.includes("Unexpected token") || 
        errorMessage.includes("NetworkError") || 
        errorMessage.includes("JSON") ||
        errorMessage.includes("parsing");

      if (isSystemError) {
        setError("Analyzing your resume... please give us a brief moment to process.");
      } else {
        setError(errorMessage);
      }
      setFile(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "var(--color-success)";
    if (score >= 60) return "var(--color-warning)";
    return "var(--color-critical)";
  };

  const getScoreShadow = (score: number) => {
    if (score >= 80) return "rgba(16,185,129,0.5)";
    if (score >= 60) return "rgba(245,158,11,0.5)";
    return "rgba(239,68,68,0.5)";
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 max-w-5xl mx-auto">
      
      {/* Hero Section */}
      <header className="text-center space-y-4 pt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          AI Resume Analyzer
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto font-medium">
          Get recruiter-grade, <span className="text-primary glow-text">ATS-powered feedback</span> to improve your resume.
        </p>
      </header>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        
        {/* Upload State — hidden when an error has occurred (fallback card shown instead) */}
        {!isAnalyzing && !result && !error && (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <div 
              className={`glass relative overflow-hidden border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300 group cursor-pointer ${
                isDragging 
                  ? "border-primary bg-primary/5 scale-[1.02] shadow-[0_0_40px_rgba(59,130,246,0.15)]" 
                  : "border-[#1e1e30] hover:border-primary/50 hover:bg-white/[0.02]"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {/* Subtle background glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/0 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">Upload your resume</h3>
                <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                   Drag & drop your PDF, DOCX, or TXT resume here, or click to browse.
                </p>
                
                <button className="bg-primary hover:bg-blue-500 text-white font-semibold py-3 px-8 rounded-xl transition-all animate-glow shadow-[0_0_15px_rgba(59,130,246,0.4)] relative overflow-hidden group/btn">
                  <span className="relative z-10">Select Resume File</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                </button>
                
                <p className="text-xs text-gray-500 mt-6 font-mono tracking-wider">SECURE & PRIVATE • PDF / DOCX / TXT • MAX 5MB</p>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="application/pdf,text/plain,.pdf,.txt,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelection(e.target.files[0]);
                  }
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="relative w-32 h-32 mb-8">
              {/* Outer spinning ring */}
              <div className="absolute inset-0 rounded-full border-t-2 border-primary border-opacity-50 animate-spin" style={{ animationDuration: '3s' }} />
              {/* Middle spinning ring (reverse) */}
              <div className="absolute inset-2 rounded-full border-r-2 border-secondary border-opacity-60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
              {/* Inner pulsing core */}
              <div className="absolute inset-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-wide">Analyzing Resume...</h3>
            <p className="text-gray-400">Performing ATS keyword matching and recruiter analysis.</p>
          </motion.div>
        )}

        {/* Issue C: Analysis-failed fallback — shown when error is set but result is null and not loading */}
        {!isAnalyzing && !result && error && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto"
          >
            {error.includes("Analyzing your resume") ? (
              <div className="glass rounded-2xl p-10 text-center border border-primary/20 bg-primary/5">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Connecting to Analysis Server</h3>
                <p className="text-gray-400 mb-6">{error}</p>
                <button
                  onClick={() => { setError(null); setFile(null); }}
                  className="bg-primary hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-xl transition-all"
                >
                  Retry Upload
                </button>
              </div>
            ) : (
              <div className="glass rounded-2xl p-10 text-center border border-critical/20 bg-critical/5">
                <AlertCircle className="w-12 h-12 text-critical mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Analysis Failed</h3>
                <p className="text-gray-400 mb-6">{error}</p>
                <button
                  onClick={() => { setError(null); setFile(null); }}
                  className="bg-primary hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-xl transition-all"
                >
                  Try Again
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Results State */}
        {result && !isAnalyzing && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
            className="space-y-6"
          >
            {/* Header controls */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">Analyzed File</p>
                  <p className="text-white font-semibold">{file?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => { setResult(null); setFile(null); }}
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 shadow-sm"
              >
                Upload New <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Score & Summary */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Score Card */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="glass rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden border-t border-t-white/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50" />
                  <h3 className="text-gray-400 font-semibold mb-6 uppercase tracking-widest text-sm relative z-10 flex items-center gap-2">
                    <Target className="w-4 h-4" /> ATS Match Score
                  </h3>
                  
                  <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                      <motion.circle 
                        cx="50" cy="50" r="45" fill="none" 
                        stroke={getScoreColor(result.score)} 
                        strokeWidth="8" 
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - result.score / 100) }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                        style={{ filter: `drop-shadow(0 0 10px ${getScoreShadow(result.score)})` }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-6xl font-extrabold text-white tracking-tighter" style={{ color: getScoreColor(result.score) }}>
                        {result.score}
                      </span>
                      <span className="text-xs text-gray-500 font-bold mt-1">OUT OF 100</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-white/5 rounded-full h-1.5 mb-2 overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full"
                      style={{ backgroundColor: getScoreColor(result.score) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${result.score}%` }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />
                  </div>
                  <div className="flex justify-between w-full text-xs text-gray-500 font-medium px-1">
                    <span>Needs Work</span>
                    <span>Excellent</span>
                  </div>
                </motion.div>

                {/* Recruiter Summary */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass rounded-2xl p-6 border-t border-t-white/5 relative"
                >
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" /> Recruiter Summary
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {result.summary}
                  </p>
                </motion.div>

                {/* Formatting Issues */}
                {result.formattingIssues && result.formattingIssues.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass rounded-2xl p-5 border-l-4 border-l-critical bg-critical/5"
                  >
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <FileWarning className="w-4 h-4 text-critical" /> Formatting Issues
                    </h3>
                    <ul className="space-y-2">
                      {result.formattingIssues.map((issue, i) => (
                        <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                          <span className="mt-1 text-critical">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>

              {/* Right Column: Detailed Analysis */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Missing Keywords */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass rounded-2xl p-6 border-t border-t-white/5"
                >
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <SearchX className="w-5 h-5 text-secondary" /> Missing ATS Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map((keyword, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20 shadow-[0_0_10px_rgba(139,92,246,0.1)]">
                        {keyword}
                      </span>
                    ))}
                    {result.missingKeywords.length === 0 && (
                      <span className="text-sm text-gray-500 italic">No major missing keywords detected.</span>
                    )}
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass rounded-2xl p-6 border-t-2 border-t-success"
                  >
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success" /> Strengths
                    </h3>
                    <ul className="space-y-4">
                      {result.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-success shrink-0 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                          <span className="leading-relaxed">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Weaknesses */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="glass rounded-2xl p-6 border-t-2 border-t-warning"
                  >
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-warning" /> Weaknesses
                    </h3>
                    <ul className="space-y-4">
                      {result.weaknesses.map((weakness, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-400 text-sm">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-warning shrink-0 shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                          <span className="leading-relaxed">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>

                {/* Suggestions */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="glass rounded-2xl p-6 border-t border-t-primary/30 relative overflow-hidden bg-gradient-to-br from-primary/5 to-transparent"
                >
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                    <Award className="w-5 h-5 text-primary" /> Actionable Improvement Steps
                  </h3>
                  <ul className="space-y-4 relative z-10">
                    {result.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-4 text-gray-200 text-sm bg-white/5 p-4 rounded-xl border border-white/5">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs shrink-0 border border-primary/30">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed pt-0.5">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


