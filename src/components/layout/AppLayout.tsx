"use client";

import { ReactNode } from "react";
import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('./Sidebar').then(mod => mod.Sidebar), { ssr: false });
const TopNavbar = dynamic(() => import('./TopNavbar').then(mod => mod.TopNavbar), { ssr: false });
const BottomNav = dynamic(() => import('./BottomNav').then(mod => mod.BottomNav), { ssr: false });
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-transparent text-slate-50 overflow-hidden font-sans relative">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 relative min-w-0 z-10">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
