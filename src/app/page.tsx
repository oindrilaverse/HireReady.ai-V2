"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart, FileText, Zap } from 'lucide-react';
import { BackgroundNet } from '@/components/layout/BackgroundNet';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] overflow-hidden font-sans relative">
      <BackgroundNet />
      
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tighter">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#007bff] to-[#8b5cf6] flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(0,123,255,0.4)]">
            <span className="text-white text-lg font-extrabold">H</span>
          </div>
          <span className="text-white">HireReady<span className="text-[#007bff]">.AI</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/signup" className="text-sm font-medium bg-white text-black px-5 py-2 rounded-full hover:bg-zinc-200 transition-all active:scale-95 shadow-lg">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-20 pb-32 text-center relative z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#007bff]/5 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#007bff]/10 border border-[#007bff]/20 text-[#007bff] text-xs font-semibold mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007bff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007bff]"></span>
            </span>
            Premium ATS Analyzer v2.0 Live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
            Optimize Your Resume with <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007bff] to-[#8b5cf6]">AI-Powered ATS Intelligence</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop guessing what recruiters want. Get enterprise-grade ATS scoring, actionable feedback, and dynamic job matching to land your dream role.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#007bff] to-[#8b5cf6] text-white rounded-full font-semibold text-lg transition-all btn-hover flex items-center justify-center gap-2">
              Analyze My Resume <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full font-semibold text-lg transition-all">
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
          <div className="glass glass-hover p-6 rounded-2xl">
            <div className="h-12 w-12 rounded-lg bg-[#007bff]/10 flex items-center justify-center mb-4 border border-[#007bff]/20">
              <FileText className="text-[#007bff] w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Smart PDF Parsing</h3>
            <p className="text-zinc-400 text-sm">Upload your resume and let our advanced AI extract and structure your professional experience flawlessly.</p>
          </div>

          <div className="glass glass-hover p-6 rounded-2xl">
            <div className="h-12 w-12 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center mb-4 border border-[#8b5cf6]/20">
              <BarChart className="text-[#8b5cf6] w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">ATS Score Breakdown</h3>
            <p className="text-zinc-400 text-sm">Get a detailed recruiter-level score covering keywords, formatting, impact, and readability.</p>
          </div>

          <div className="glass glass-hover p-6 rounded-2xl">
            <div className="h-12 w-12 rounded-lg bg-[#007bff]/10 flex items-center justify-center mb-4 border border-[#007bff]/20">
              <Zap className="text-[#007bff] w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">AI Job Matching</h3>
            <p className="text-zinc-400 text-sm">Paste a job description and see your exact compatibility percentage and missing skills instantly.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
