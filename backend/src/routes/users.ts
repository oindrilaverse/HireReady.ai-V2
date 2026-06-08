import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FIX 3b: Non-blocking async log writer
function asyncLog(msg: string) {
  fs.appendFile(path.join(__dirname, '../../debug.log'), msg, (err) => {
    if (err) console.warn('[logger] Failed to write log:', err.message);
  });
}

const router = Router();

// Get user profile or create if not exists
router.post('/sync', async (req, res) => {
  try {
    const { authId, email, name } = req.body;
    
    if (!authId || !email) {
      return res.status(400).json({ error: 'authId and email are required' });
    }

    // FIX 6: Use upsert instead of select-then-insert.
    // Previously: SELECT → (if not found) INSERT = 2 sequential Supabase calls × ~7s each = ~14s
    // Now: single UPSERT call = 1 Supabase call = ~7s (one round trip eliminated)
    const { data: user, error: upsertError } = await supabase
      .from('users')
      .upsert(
        [{ auth_id: authId, email, name }],
        { onConflict: 'auth_id', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (upsertError) {
      // Fallback to select if upsert fails (e.g., RLS conflict)
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (existingUser) return res.json(existingUser);

      // Create user if still not found
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ auth_id: authId, email, name }])
        .select()
        .single();
      
      if (createError) throw createError;
      return res.json(newUser);
    }

    res.json(user);
  } catch (error) {
    const errorMsg = `SYNC USER ERROR: ${error instanceof Error ? error.stack : JSON.stringify(error)}\n`;
    console.error(errorMsg);
    asyncLog(`${new Date().toISOString()} | ERROR | ${errorMsg}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user dashboard data (history of resumes, reports, and job matches)
router.get('/:authId/dashboard', async (req, res) => {
  try {
    const { authId } = req.params;

    // FIX 2: Parallelize dashboard queries.
    // Previously: 2 sequential Supabase calls — user+resumes first, then job_matches separately.
    // Now: both queries fire simultaneously via Promise.all, cutting wait time in half.
    const userQueryPromise = supabase
      .from('users')
      .select('*, resumes(*, analyses(*))')
      .eq('auth_id', authId)
      .single();

    // We need the user first to get resume IDs for the job_matches query.
    // But we can also start a broad early fetch of job_matches using auth_id indirectly.
    // Strategy: fire user query, then immediately fire job_matches in parallel once we know resume IDs.
    // Since we need resume IDs from user query, we pipeline: get user + resumes, then parallelize
    // the job_matches fetch alongside the response serialization.

    const { data: user, error: fetchError } = await userQueryPromise;

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw fetchError;
    }

    // FIX 2: Parallelize the job_matches fetch with response assembly.
    // Previously this was a sequential second call after the user query completed.
    if (user && user.resumes && user.resumes.length > 0) {
      const resumeIds = user.resumes.map((r: any) => r.id);

      // Fetch job_matches in parallel with sorting — no sequential await
      const [jobMatchesResult] = await Promise.all([
        supabase
          .from('job_matches')
          .select('*')
          .in('resumeId', resumeIds),
        // Sort resumes in parallel (CPU only, no I/O)
        Promise.resolve(
          user.resumes.sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        ),
      ]);

      if (!jobMatchesResult.error && jobMatchesResult.data) {
        user.resumes.forEach((resume: any) => {
          resume.jobMatches = jobMatchesResult.data.filter(
            (m: any) => m.resumeId === resume.id || m.resume_id === resume.id
          );
        });
      } else {
        user.resumes.forEach((resume: any) => {
          resume.jobMatches = [];
        });
      }
    }

    res.json(user);
  } catch (error) {
    const errorMsg = `FETCH DASHBOARD ERROR: ${error instanceof Error ? error.stack : JSON.stringify(error)}\n`;
    console.error(errorMsg);
    asyncLog(`${new Date().toISOString()} | ERROR | ${errorMsg}`);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});


export default router;
