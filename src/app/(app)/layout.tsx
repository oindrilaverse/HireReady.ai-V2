"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { ReactNode } from "react";
import { useAuthSync } from "@/hooks/useAuthSync";

export default function AppRouteLayout({ children }: { children: ReactNode }) {
  useAuthSync(); // Centralized sync
  return <AppLayout>{children}</AppLayout>;
}

