"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Target, 
  Briefcase 
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileItems = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Analyze", href: "/analyzer", icon: FileText },
  { name: "Jobs", href: "/job-match", icon: Target },
  { name: "Cover", href: "/cover-letter", icon: Briefcase },
];


export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass border-t border-[#1e1e30] z-40 flex items-center justify-around px-2 pb-safe">
      {mobileItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 relative",
              isActive ? "text-primary" : "text-gray-500 hover:text-gray-300"
            )}
          >
            {isActive && (
              <span className="absolute top-0 w-8 h-0.5 bg-primary rounded-b-full shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
            )}
            <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-gray-400")} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
