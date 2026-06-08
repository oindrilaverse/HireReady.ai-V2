"use client";

import { useEffect, useState, useRef } from "react";
import { useCareerStore } from "@/store/careerStore";
import { createClient } from "@/utils/supabase/client";
import { getApiUrl } from "@/lib/utils";

// Shared across all instances to prevent duplicate concurrent API requests
let globalSyncInProgress = false;

export function useAuthSync() {
  const { 
    isSynced, 
    syncedUserId, 
    setSynced, 
    clearStore, 
    user, 
    setUser 
  } = useCareerStore();
  const [hydrated, setHydrated] = useState(false);
  const supabaseRef = useRef<any>(null);

  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }
  const supabase = supabaseRef.current;

  // Ensure Zustand store is fully hydrated from localStorage before checking sync status
  useEffect(() => {
    setHydrated(useCareerStore.persist.hasHydrated());
    const unsub = useCareerStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    let active = true;

    // Seed Zustand user synchronously from local cache on mount if empty to avoid blank screen
    if (!useCareerStore.getState().user) {
      const cached = supabase.auth.getSessionOffline?.();
      if (cached && cached.user) {
        setUser(cached.user);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (!active) return;
      const sessionUser = session?.user || null;
      
      if (sessionUser) {
        setUser(sessionUser);
        
        // Read latest state values to determine if synchronization is necessary
        const currentStore = useCareerStore.getState();
        const needsSync = !currentStore.isSynced || currentStore.syncedUserId !== sessionUser.id;
        
        if (needsSync && !globalSyncInProgress) {
          globalSyncInProgress = true;
          try {
            const syncRes = await fetch(getApiUrl("/users/sync"), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                authId: sessionUser.id,
                email: sessionUser.email,
                name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0],
              }),
            });

            if (syncRes.ok && active) {
              setSynced(true, sessionUser.id);
            }
          } catch (err) {
            console.error("Auth Sync Failed:", err);
          } finally {
            globalSyncInProgress = false;
          }
        }
      } else {
        setUser(null);
        if (useCareerStore.getState().isSynced) {
          clearStore();
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [hydrated]);

  return { user: hydrated ? user : null, isSynced: hydrated && isSynced };
}
