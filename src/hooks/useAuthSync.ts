"use client";

import { useEffect, useState, useRef } from "react";
import { useCareerStore } from "@/store/careerStore";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/utils";

export function useAuthSync() {
  const { isSynced, setSynced, setDashboardData } = useCareerStore();
  const [user, setUser] = useState<any>(null);
  const syncInProgress = useRef(false);
  const supabaseRef = useRef<any>(null);

  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }
  const supabase = supabaseRef.current;


  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        if (!isSynced && !syncInProgress.current) {
          syncInProgress.current = true;
          try {
            // Sync user with backend
            const syncRes = await fetch(getApiUrl("/users/sync"), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                authId: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              }),
            });

            if (syncRes.ok) {
              const res = await fetch(getApiUrl(`/users/${session.user.id}/dashboard`));
              if (res.ok) {
                const data = await res.json();
                setDashboardData(data);
                setSynced(true);
              }
            }
          } catch (err) {
            console.error("Auth Sync Failed:", err);
          } finally {
            syncInProgress.current = false;
          }
        }
      } else {
        setUser(null);
        if (isSynced) setSynced(false);
      }
    }

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setSynced(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Run once on mount — isSynced state is read via ref internally

  return { user, isSynced };
}
