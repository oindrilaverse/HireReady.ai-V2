"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  UploadCloud,
  Cpu,
  BadgeCheck,
  FileText,
  BarChart2,
  Zap,
  Star,
  ChevronRight,
} from "lucide-react";

// ── Animation helpers ─────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: "easeOut" as const },
});

// ── Data ──────────────────────────────────────────────────────────────────────

const steps = [
  {
    number: "01",
    icon: UploadCloud,
    title: "Upload Your Resume",
    desc: "Drop your PDF, DOCX, or TXT file. Our parser handles any format — no reformatting needed.",
    color: "#ff007f",
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI Analyses Every Line",
    desc: "Gemini AI scores your resume on ATS keywords, formatting, impact verbs, and skill gaps in seconds.",
    color: "#a855f7",
  },
  {
    number: "03",
    icon: BadgeCheck,
    title: "Get Hired Faster",
    desc: "Receive recruiter-grade feedback and a step-by-step action plan to land more interviews.",
    color: "#10b981",
  },
];

const features = [
  {
    icon: FileText,
    title: "Smart PDF Parsing",
    desc: "Advanced AI extracts and structures your experience flawlessly from any resume format.",
    color: "#ff007f",
  },
  {
    icon: BarChart2,
    title: "ATS Score Breakdown",
    desc: "Detailed recruiter-level scoring across keywords, formatting, impact, and readability.",
    color: "#a855f7",
  },
  {
    icon: Zap,
    title: "AI Job Matching",
    desc: "Paste a job description and instantly see your compatibility score and missing skills.",
    color: "#10b981",
  },
];

const testimonials = [
  {
    quote: "Got 3 interview calls in the first week after fixing my resume with HireReady.AI. The keyword gap report was eye-opening.",
    name: "Priya S.",
    role: "Frontend Engineer",
    stars: 5,
  },
  {
    quote: "I went from 0 callbacks to landing a role at a top fintech. The ATS score made me realise exactly why I was being filtered out.",
    name: "Marcus T.",
    role: "Product Manager",
    stars: 5,
  },
  {
    quote: "The job matcher alone is worth it. Pasted the JD and knew in 10 seconds which skills to highlight. Saved me hours.",
    name: "Ananya R.",
    role: "Data Analyst",
    stars: 5,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] overflow-x-hidden font-sans relative">
      {/* Cinematic Background Video Container (Hardware-Accelerated) */}
      <div 
        className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none select-none"
        style={{ transform: "translate3d(0, 0, 0)" }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/cinematic-poster.jpg"
          className="absolute top-0 left-0 w-full h-full object-cover will-change-transform"
          style={{ transform: "translate3d(0, 0, 0)" }}
        >
          <source src="/car-transforms.mp4" type="video/mp4" />
        </video>
        {/* Dark subtle overlay for perfect typography contrast and smooth blending */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-[#09090b] pointer-events-none" 
          aria-hidden="true"
        />
      </div>

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="container mx-auto px-6 py-5 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tighter font-display">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#ff007f] to-[#a855f7] flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,0,127,0.4)]">
            <span className="text-white text-base font-extrabold">H</span>
          </div>
          <span className="text-white">
            HireReady<span className="text-[#ff007f]">.AI</span>
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-zinc-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#features"     className="hover:text-white transition-colors">Features</a>
          <Link href="/pricing"   className="hover:text-white transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login"  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:inline">Login</Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-white text-black px-5 py-2 rounded-full hover:bg-zinc-100 transition-all active:scale-95 shadow-lg"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-6 pt-20 pb-28 text-center relative z-10">
        {/* Radial glow */}
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,0,127,0.06) 0%, transparent 70%)" }}
        />

        <motion.div {...fadeUp(0)} className="max-w-4xl mx-auto">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ff007f]/10 border border-[#ff007f]/25 text-[#ff007f] text-xs font-bold mb-8 tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff007f] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff007f]" />
            </span>
            AI-Powered ATS Analyzer — Live
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.08] font-display">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
              MAKE IT POSSIBLE WITH<br className="hidden md:block" />
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff007f] to-[#a855f7]">
              HireReady.AI
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            HireReady.AI gives you a recruiter-grade ATS score, keyword gap report, and
            personalised action plan — in under 60 seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#ff007f] to-[#a855f7] text-white rounded-full font-bold text-base transition-all hover:opacity-90 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,0,127,0.35)]"
            >
              Analyze My Resume Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full font-semibold text-base transition-all"
            >
              See How It Works
            </a>
          </div>

          {/* Social proof micro-line */}
          <p className="mt-8 text-xs text-zinc-600 tracking-wide">
            No credit card required &nbsp;·&nbsp; Results in &lt;60 seconds &nbsp;·&nbsp; 3 free scans
          </p>
        </motion.div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="container mx-auto px-6 py-24 relative z-10">
        <motion.div {...fadeUp(0.05)} className="text-center mb-16">
          <span className="text-xs font-bold tracking-widest uppercase text-[#ff007f] bg-[#ff007f]/10 border border-[#ff007f]/20 px-3 py-1 rounded-full">
            How It Works
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-white tracking-tight font-display">
            From upload to offer letter — 3 steps
          </h2>
          <p className="mt-3 text-zinc-400 max-w-xl mx-auto text-sm">
            No sign-up friction. Drop your file, get your score, and start improving immediately.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop only) */}
          <div
            aria-hidden
            className="hidden md:block absolute top-[3.25rem] left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px"
            style={{ background: "linear-gradient(90deg, rgba(255,0,127,0.3), rgba(168,85,247,0.3), rgba(16,185,129,0.3))" }}
          />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              {...fadeUp(i * 0.12)}
              className="relative glass rounded-3xl p-8 text-center border border-white/5 hover:border-white/10 transition-all duration-300 group"
            >
              {/* Number chip */}
              <div
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full border"
                style={{
                  color: step.color,
                  background: `${step.color}18`,
                  borderColor: `${step.color}35`,
                }}
              >
                {step.number}
              </div>

              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 border transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${step.color}15`, borderColor: `${step.color}30` }}
              >
                <step.icon className="w-6 h-6" style={{ color: step.color }} />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-7 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-zinc-100 transition-all active:scale-95 shadow-lg"
          >
            Start for Free <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" className="container mx-auto px-6 py-24 relative z-10">
        <motion.div {...fadeUp(0.05)} className="text-center mb-16">
          <span className="text-xs font-bold tracking-widest uppercase text-[#a855f7] bg-[#a855f7]/10 border border-[#a855f7]/20 px-3 py-1 rounded-full">
            Features
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-white tracking-tight font-display">
            Everything you need to get hired
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          {features.map((f, i) => (
            <motion.div
              key={i}
              {...fadeUp(i * 0.1)}
              className="glass glass-hover rounded-2xl p-7 border border-white/5 hover:border-white/10 group transition-all duration-300"
            >
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center mb-5 border transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${f.color}12`, borderColor: `${f.color}25` }}
              >
                <f.icon className="w-5 h-5" style={{ color: f.color }} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      <section className="container mx-auto px-6 py-24 relative z-10">
        <motion.div {...fadeUp(0.05)} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-display">
            Loved by job seekers
          </h2>
          <p className="mt-3 text-zinc-400 text-sm max-w-md mx-auto">
            Real feedback from people who landed their next role using HireReady.AI.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              {...fadeUp(i * 0.1)}
              className="glass rounded-2xl p-7 border border-white/5 flex flex-col gap-5"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="text-white font-semibold text-sm">{t.name}</p>
                <p className="text-zinc-500 text-xs">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Pricing Teaser ─────────────────────────────────────────────── */}
      <section className="container mx-auto px-6 py-16 relative z-10">
        <motion.div
          {...fadeUp(0.05)}
          className="max-w-3xl mx-auto glass rounded-3xl p-10 border border-white/8 bg-gradient-to-br from-[#ff007f]/5 via-transparent to-[#a855f7]/5 text-center"
        >
          <span className="text-xs font-bold tracking-widest uppercase text-[#ff007f] bg-[#ff007f]/10 border border-[#ff007f]/20 px-3 py-1 rounded-full">
            Pricing
          </span>
          <h2 className="mt-5 text-3xl font-extrabold text-white tracking-tight font-display">
            Start free. Upgrade when ready.
          </h2>
          <p className="mt-3 text-zinc-400 text-sm max-w-md mx-auto">
            3 free scans included — no credit card needed. Go Pro for unlimited scans,
            full skill-gap reports, and priority AI.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="text-left glass rounded-2xl px-6 py-4 border border-white/8 w-full sm:w-auto">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1 font-bold">Free</p>
              <p className="text-3xl font-extrabold text-white">$0<span className="text-zinc-500 text-sm font-medium ml-1">/ mo</span></p>
              <p className="text-zinc-400 text-xs mt-1">3 scans · Basic ATS score</p>
            </div>
            <span className="text-zinc-700 font-bold hidden sm:block">vs</span>
            <div
              className="text-left rounded-2xl px-6 py-4 border border-[#ff007f]/40 w-full sm:w-auto"
              style={{ background: "linear-gradient(135deg, rgba(255,0,127,0.12), rgba(168,85,247,0.08))" }}
            >
              <p className="text-xs text-[#ff007f] uppercase tracking-widest mb-1 font-bold">Pro</p>
              <p className="text-3xl font-extrabold text-white">$12<span className="text-zinc-500 text-sm font-medium ml-1">/ mo</span></p>
              <p className="text-zinc-400 text-xs mt-1">Unlimited · Full reports · Job matcher</p>
            </div>
          </div>

          <Link
            href="/pricing"
            className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#ff007f] to-[#a855f7] text-white rounded-full font-bold text-sm hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-[0_0_25px_rgba(255,0,127,0.3)]"
          >
            View Full Pricing <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="container mx-auto px-6 py-24 text-center relative z-10">
        <motion.div {...fadeUp(0.05)} className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight font-display">
            Your dream job is{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff007f] to-[#a855f7]">
              one upload away.
            </span>
          </h2>
          <p className="text-zinc-400 mb-8 text-base">
            Join thousands of job seekers who stopped guessing and started getting callbacks.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-[#ff007f] to-[#a855f7] text-white rounded-full font-bold text-base hover:opacity-90 hover:-translate-y-0.5 transition-all active:scale-95 shadow-[0_0_35px_rgba(255,0,127,0.4)]"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-zinc-600 text-xs">No credit card · Cancel anytime</p>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 relative z-10">
        <div className="container mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <span>
            <span className="text-white font-semibold">HireReady.AI</span> — AI Resume Analyzer
          </span>
          <div className="flex items-center gap-6">
            <Link href="/pricing"    className="hover:text-zinc-400 transition-colors">Pricing</Link>
            <Link href="/login"      className="hover:text-zinc-400 transition-colors">Login</Link>
            <Link href="/signup"     className="hover:text-zinc-400 transition-colors">Sign Up</Link>
            <Link href="/scan-history" className="hover:text-zinc-400 transition-colors">My Scans</Link>
          </div>
          <span>© {new Date().getFullYear()} HireReady.AI. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
