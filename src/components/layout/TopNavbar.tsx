"use client";

import { Bell, Search, LogOut } from "lucide-react";
import { useAuthSync } from "@/hooks/useAuthSync";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function TopNavbar() {
  const { user } = useAuthSync();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Do NOT call router.refresh() here — it fires middleware which redirects to /login
    // simultaneously with router.push('/login'), creating a navigation loop.
    router.push('/login');
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <header className="h-16 border-b border-white/5 bg-[#040406]/45 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search resumes, jobs, or templates..." 
            className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent transition-all"
          />
        </div>
        
        {/* Mobile Logo */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="font-bold text-white text-sm">H</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-white font-display">HireReady</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
          <Bell className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2 pr-2 border-r border-white/5 mr-2">
            <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hidden sm:block">System Online</span>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-xs font-bold border-2 border-white/10 shadow-lg">
                  {initials}
                </div>
                <span className="text-sm font-medium text-zinc-300 hidden sm:block">{displayName}</span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="p-2 text-zinc-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10 group"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
        </div>

      </div>
    </header>
  );
}
