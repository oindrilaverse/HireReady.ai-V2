"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, BarChart, FileText, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans">
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tighter">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center">
            <span className="text-white text-lg">H</span>
          </div>
          HireReady.AI
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/signup" className="text-sm font-medium bg-white text-slate-900 px-4 py-2 rounded-full hover:bg-slate-200 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-20 pb-32 text-center relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-800/50 text-blue-400 text-xs font-semibold mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Premium ATS Analyzer v2.0 Live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            Optimize Your Resume with <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">AI-Powered ATS Intelligence</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop guessing what recruiters want. Get enterprise-grade ATS scoring, actionable feedback, and dynamic job matching to land your dream role.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] flex items-center justify-center gap-2">
              Analyze My Resume <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-full font-semibold text-lg transition-all">
              View Features
            </Link>
          </div>
        </motion.div>

        {/* Feature Cards Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-24 grid md:grid-cols-3 gap-6 text-left"
          id="features"
        >
          <div className="bg-slate-900/50 border border-slate-800/50 p-6 rounded-2xl backdrop-blur-sm hover:bg-slate-900 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
              <FileText className="text-blue-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart PDF Parsing</h3>
            <p className="text-slate-400 text-sm">Upload your resume and let our advanced AI extract and structure your professional experience flawlessly.</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 p-6 rounded-2xl backdrop-blur-sm hover:bg-slate-900 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20">
              <BarChart className="text-indigo-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">ATS Score Breakdown</h3>
            <p className="text-slate-400 text-sm">Get a detailed recruiter-level score covering keywords, formatting, impact, and readability.</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/50 p-6 rounded-2xl backdrop-blur-sm hover:bg-slate-900 transition-colors">
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20">
              <Zap className="text-purple-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Job Matching</h3>
            <p className="text-slate-400 text-sm">Paste a job description and see your exact compatibility percentage and missing skills instantly.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
