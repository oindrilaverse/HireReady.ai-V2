"use client";

import { PenTool, Rocket } from "lucide-react";
import { motion } from "framer-motion";

export default function BuilderPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(255,0,127,0.2)]"
      >
        <PenTool className="w-10 h-10 text-primary" />
      </motion.div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">AI Resume Builder</h1>
        <p className="text-gray-400 max-w-md mx-auto">
          We&apos;re currently fine-tuning the AI to help you build the perfect resume. 
          Stay tuned for a recruiter-grade experience.
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
        <Rocket className="w-4 h-4" />
        <span>Coming Soon</span>
      </div>
    </div>
  );
}
