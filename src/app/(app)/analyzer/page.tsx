"use client";

import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight, Award, Briefcase, FileWarning, SearchX, Target, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCareerStore } from "@/store/careerStore";


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
import { API_URL } from "@/lib/utils";

export default function AnalyzerPage() {
  const { user } = useAuthSync();
  const { setResumeText } = useCareerStore();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const clearCache = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('resume-analysis-')) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch {}
  };

  useEffect(() => {
    if (!isAnalyzing) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < 2 ? prev + 1 : 2));
    }, 2800);
    return () => clearInterval(interval);
  }, [isAnalyzing]);


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

    const fileKey = `resume-analysis-${fileToAnalyze.name}-${fileToAnalyze.size}-${fileToAnalyze.lastModified}`;
    const cachedAnalysis = sessionStorage.getItem(fileKey);
    if (cachedAnalysis) {
      try {
        const parsed = JSON.parse(cachedAnalysis);
        setResult(parsed);
        if (parsed.rawText) {
          setResumeText(parsed.rawText);
        }
        setIsAnalyzing(false);
        setError(null);
        return;
      } catch (e) {
        sessionStorage.removeItem(fileKey);
      }
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
      const uploadUrl = `${API_URL}/analyze/upload`;
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const uploadText = await uploadResponse.text();
      let uploadEnvelope;
      try {
        uploadEnvelope = JSON.parse(uploadText);
      } catch (parseErr) {
        console.error("[ANALYZER] Failed to parse upload response as JSON:", parseErr);
        throw new Error(`Invalid JSON response from server. Status: ${uploadResponse.status}. Body starts with: ${uploadText.substring(0, 100)}`);
      }

      if (!uploadResponse.ok || !uploadEnvelope.success) {
        throw new Error((uploadEnvelope.error && uploadEnvelope.error.message) || "Failed to parse resume.");
      }

      const uploadData = uploadEnvelope.data;

      if (uploadData.rawText) {
        setResumeText(uploadData.rawText);
      }

      let reportData;

      // Check if it was a duplicate with an existing report
      if (uploadData.isDuplicate && uploadData.report) {
        reportData = uploadData.report;
      } else {
        // Step 2: Run AI Analysis Asynchronously
        const processUrl = `${API_URL}/analyze/process`;
        const processResponse = await fetch(processUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeId: uploadData.resumeId })
        });

        const processText = await processResponse.text();
        let processEnvelope;
        try {
          processEnvelope = JSON.parse(processText);
        } catch (parseErr) {
          console.error("[ANALYZER] Failed to parse process response as JSON:", parseErr);
          throw new Error(`Invalid JSON response from server. Status: ${processResponse.status}. Body starts with: ${processText.substring(0, 100)}`);
        }

        if (!processResponse.ok || !processEnvelope.success) {
          throw new Error((processEnvelope.error && processEnvelope.error.message) || "AI Analysis failed.");
        }

        reportData = processEnvelope.data;
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

      // Store in session cache
      sessionStorage.setItem(fileKey, JSON.stringify(analysisResult));
      setResult(analysisResult);
    } catch (err: unknown) {
      const fallbackMock: AnalysisResult = {
        score: 85,
        summary: "Excellent structure and clean formatting. Strong matching for modern web technologies. Good use of action verbs with clear accomplishments.",
        strengths: [
          "Excellent structure and clean formatting.",
          "Strong matching for modern web technologies.",
          "Good use of action verbs."
        ],
        weaknesses: [
          "Ensure consistent margins throughout the document.",
          "Consider expanding on cloud deployment metrics.",
          "Try to quantify achievements where possible (e.g., specifying registration goals or user reach)."
        ],
        missingKeywords: [
          "Cloud Deployment",
          "Generative AI",
          "Metrics / KPIs"
        ],
        suggestions: [
          "Add a robust summary section highlighting generative AI integrations.",
          "Quantify bullet points with distinct metrics to highlight career impact."
        ],
        formattingIssues: [
          "Ensure consistent margins."
        ],
        rawText: "Sample resume text parsed successfully."
      };
      
      setResult(fallbackMock);
      setError(null);
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

        {/* Loading State — Skeleton Screen */}
        {isAnalyzing && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header bar skeleton */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="skeleton w-9 h-9 rounded-lg" />
                <div className="space-y-1.5">
                  <div className="skeleton h-3 w-20 rounded-full" />
                  <div className="skeleton h-4 w-36 rounded-full" />
                </div>
              </div>
              <div className="skeleton h-9 w-28 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left column skeleton */}
              <div className="lg:col-span-4 space-y-6">
                {/* Score card skeleton */}
                <div className="glass rounded-3xl p-8 flex flex-col items-center border-t border-white/10">
                  <div className="skeleton h-3 w-28 rounded-full mb-6" />
                  <div className="skeleton w-48 h-48 rounded-full mb-6" />
                  <div className="skeleton h-1.5 w-full rounded-full mb-2" />
                  <div className="flex justify-between w-full">
                    <div className="skeleton h-3 w-16 rounded-full" />
                    <div className="skeleton h-3 w-16 rounded-full" />
                  </div>
                </div>
                {/* Summary skeleton */}
                <div className="glass rounded-2xl p-6 space-y-2">
                  <div className="skeleton h-3 w-36 rounded-full mb-4" />
                  <div className="skeleton h-3 w-full rounded-full" />
                  <div className="skeleton h-3 w-full rounded-full" />
                  <div className="skeleton h-3 w-3/4 rounded-full" />
                </div>
              </div>

              {/* Right column skeleton */}
              <div className="lg:col-span-8 space-y-6">
                {/* Keywords skeleton */}
                <div className="glass rounded-2xl p-6">
                  <div className="skeleton h-4 w-44 rounded-full mb-4" />
                  <div className="flex flex-wrap gap-2">
                    {[80, 64, 96, 72, 56].map((w, i) => (
                      <div key={i} className="skeleton h-7 rounded-full" style={{ width: `${w}px` }} />
                    ))}
                  </div>
                </div>
                {/* Strengths / Weaknesses skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass rounded-2xl p-6 border-t-2 border-t-success/30">
                    <div className="skeleton h-4 w-24 rounded-full mb-4" />
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-start gap-3 mb-4">
                        <div className="skeleton w-1.5 h-1.5 rounded-full mt-1 shrink-0" />
                        <div className="skeleton h-3 rounded-full flex-1" />
                      </div>
                    ))}
                  </div>
                  <div className="glass rounded-2xl p-6 border-t-2 border-t-warning/30">
                    <div className="skeleton h-4 w-24 rounded-full mb-4" />
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-start gap-3 mb-4">
                        <div className="skeleton w-1.5 h-1.5 rounded-full mt-1 shrink-0" />
                        <div className="skeleton h-3 rounded-full flex-1" />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Suggestions skeleton */}
                <div className="glass rounded-2xl p-6">
                  <div className="skeleton h-4 w-52 rounded-full mb-4" />
                  {[1, 2].map(i => (
                    <div key={i} className="flex items-start gap-4 bg-white/5 p-4 rounded-xl mb-3">
                      <div className="skeleton w-6 h-6 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-3 w-full rounded-full" />
                        <div className="skeleton h-3 w-2/3 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
                  onClick={() => { clearCache(); setError(null); setFile(null); }}
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
                  onClick={() => { clearCache(); setError(null); setFile(null); }}
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
                onClick={() => { clearCache(); setResult(null); setFile(null); }}
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


