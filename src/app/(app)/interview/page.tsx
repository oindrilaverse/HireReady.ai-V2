"use client";

import { MessageSquare, Rocket } from "lucide-react";
import { motion } from "framer-motion";

export default function InterviewPrepPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-20 h-20 rounded-3xl bg-success/20 flex items-center justify-center border border-success/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
      >
        <MessageSquare className="w-10 h-10 text-success" />
      </motion.div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Interview Prep</h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Practice makes perfect. Our AI coach will be ready to grill you soon.
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-success bg-success/10 px-4 py-2 rounded-full border border-success/20">
        <Rocket className="w-4 h-4" />
        <span>Coming Soon</span>
      </div>
    </div>
  );
}
