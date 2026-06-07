import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle, Zap, Shield, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing | HireReady.AI",
  description:
    "Simple, transparent pricing. Start free and upgrade when you're ready for unlimited AI-powered resume analysis.",
};

// ── Data ──────────────────────────────────────────────────────────────────────

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "Perfect for getting started",
    highlight: false,
    cta: { label: "Get Started Free", href: "/signup" },
    features: [
      { text: "3 resume scans per month",       included: true  },
      { text: "ATS compatibility score",         included: true  },
      { text: "Missing keywords report",         included: true  },
      { text: "Basic strengths & weaknesses",    included: true  },
      { text: "Full skill gap analysis",         included: false },
      { text: "Actionable improvement steps",    included: false },
      { text: "Job description matcher",         included: false },
      { text: "Cover letter generator",          included: false },
      { text: "Priority AI processing",          included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12",
    period: "per month",
    tagline: "For serious job seekers",
    highlight: true,
    badge: "Most Popular",
    cta: { label: "Upgrade to Pro", href: "/signup?plan=pro" },
    features: [
      { text: "Unlimited resume scans",          included: true  },
      { text: "ATS compatibility score",         included: true  },
      { text: "Missing keywords report",         included: true  },
      { text: "Full strengths & weaknesses",     included: true  },
      { text: "Full skill gap analysis",         included: true  },
      { text: "Actionable improvement steps",    included: true  },
      { text: "Job description matcher",         included: true  },
      { text: "Cover letter generator",          included: true,  soon: true },
      { text: "Priority AI processing",          included: true  },
    ],
  },
] as const;

const trust = [
  { icon: Shield, text: "No credit card required to start" },
  { icon: Zap,    text: "AI results in under 60 seconds"   },
  { icon: Clock,  text: "Cancel Pro anytime, instantly"    },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#040406] text-white selection:bg-primary/30">

      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(255,0,127,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-5xl mx-auto px-4 py-20 space-y-16">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <header className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="inline-block text-xs font-bold tracking-widest uppercase text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
            Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight font-display">
            Simple pricing,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff007f] to-[#a855f7]">
              no surprises
            </span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Get recruiter-grade ATS feedback in seconds. Start free — upgrade
            only when your job search demands more.
          </p>
        </header>

        {/* ── Cards ────────────────────────────────────────────────────── */}
        <section
          aria-label="Pricing plans"
          className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start"
        >
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={[
                "relative rounded-3xl p-8 flex flex-col gap-8 transition-all duration-300",
                plan.highlight
                  ? "bg-[rgba(10,10,15,0.7)] border-2 border-primary/50 shadow-[0_0_60px_rgba(255,0,127,0.12)] backdrop-blur-xl"
                  : "bg-[rgba(10,10,15,0.45)] border border-white/8 backdrop-blur-md",
              ].join(" ")}
            >
              {/* Popular badge */}
              {plan.highlight && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[11px] font-bold tracking-widest uppercase px-4 py-1 rounded-full shadow-[0_0_20px_rgba(255,0,127,0.5)]">
                  {plan.badge}
                </span>
              )}

              {/* Header */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                  {plan.name}
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-extrabold tracking-tight text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-500 text-sm mb-1.5">{plan.period}</span>
                </div>
                <p className="text-gray-400 text-sm">{plan.tagline}</p>
              </div>

              {/* CTA */}
              <Link
                href={plan.cta.href}
                className={[
                  "block text-center font-bold py-3.5 px-6 rounded-xl text-sm transition-all duration-200",
                  plan.highlight
                    ? "bg-primary hover:bg-[#ff007f]/90 text-white shadow-[0_0_25px_rgba(255,0,127,0.4)] hover:shadow-[0_0_35px_rgba(255,0,127,0.6)] hover:-translate-y-0.5"
                    : "bg-white/8 hover:bg-white/12 text-white border border-white/10 hover:border-white/20",
                ].join(" ")}
              >
                {plan.cta.label}
              </Link>

              {/* Divider */}
              <div className="border-t border-white/6" />

              {/* Feature list */}
              <ul className="space-y-3.5">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {feat.included ? (
                      <CheckCircle2 className="w-4.5 h-4.5 mt-0.5 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4.5 h-4.5 mt-0.5 shrink-0 text-white/15" />
                    )}
                    <span
                      className={[
                        "text-sm leading-snug",
                        feat.included ? "text-gray-200" : "text-gray-600",
                      ].join(" ")}
                    >
                      {feat.text}
                      {"soon" in feat && feat.soon && (
                        <span className="ml-2 inline-block text-[10px] font-bold tracking-wider uppercase bg-amber-400/15 text-amber-400 border border-amber-400/25 px-1.5 py-0.5 rounded-md align-middle">
                          Coming soon
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* ── Trust row ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          {trust.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* ── FAQ teaser ───────────────────────────────────────────────── */}
        <section className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-xl font-bold text-white text-center mb-6 font-display">
            Common questions
          </h2>

          {[
            {
              q: "What counts as one scan?",
              a: "Each unique resume file you upload and analyze counts as one scan. Re-analyzing the same file (same content) is detected automatically and does not use an extra scan.",
            },
            {
              q: "Do unused free scans roll over?",
              a: "No — free scans reset at the start of each calendar month. Pro users never worry about limits.",
            },
            {
              q: "What is the Cover Letter Generator?",
              a: "An upcoming Pro feature that drafts a tailored cover letter based on your resume and a target job description. We'll notify Pro users the moment it goes live.",
            },
            {
              q: "Can I cancel Pro at any time?",
              a: "Yes. Cancel from your account settings and you keep Pro access until the end of your current billing period — no questions asked.",
            },
          ].map(({ q, a }, i) => (
            <details
              key={i}
              className="group bg-white/[0.03] border border-white/7 rounded-2xl px-6 py-4 cursor-pointer transition-all hover:border-white/12"
            >
              <summary className="list-none flex items-center justify-between font-semibold text-sm text-white select-none">
                {q}
                <span className="ml-4 shrink-0 text-gray-500 group-open:rotate-45 transition-transform duration-200 text-lg leading-none">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-gray-400 leading-relaxed">{a}</p>
            </details>
          ))}
        </section>

        {/* ── Bottom CTA ───────────────────────────────────────────────── */}
        <div className="text-center space-y-4 pt-4">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
          <p className="text-gray-600 text-xs max-w-sm mx-auto">
            HireReady.AI uses bank-grade TLS encryption. We never sell or share
            your resume data.
          </p>
        </div>

      </div>
    </div>
  );
}
