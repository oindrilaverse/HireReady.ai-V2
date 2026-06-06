import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getApiBase = (): string => {
  const defaultBase = "https://hireready-ai-v2.onrender.com/api";
  let base = process.env.NEXT_PUBLIC_API_URL || defaultBase;
  
  // Ignore Vercel preview/production frontend URLs if they are mistakenly set as NEXT_PUBLIC_API_URL
  if (base.includes('vercel.app')) {
    base = defaultBase;
  }
  
  // Normalize base: remove trailing slashes
  base = base.replace(/\/+$/, '');
  
  // If it doesn't start with protocol, fallback to defaultBase
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    base = defaultBase;
  }
  
  // If it doesn't end with '/api', append '/api'
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }
  
  return base;
};

export const API_URL = getApiBase();
