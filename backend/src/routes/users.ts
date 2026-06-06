import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Get user profile or create if not exists
router.post('/sync', async (req, res) => {
  try {
    const { authId, email, name } = req.body;
    
    if (!authId || !email) {
      return res.status(400).json({ error: 'authId and email are required' });
    }

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw fetchError;
    }

    if (!user) {
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
    try {
      const logFile = path.join(__dirname, '../../debug.log');
      fs.appendFileSync(logFile, `${new Date().toISOString()} | ERROR | ${errorMsg}`);
    } catch (e) {}
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user dashboard data (history of resumes, reports, and job matches)
router.get('/:authId/dashboard', async (req, res) => {
  try {
    const { authId } = req.params;

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*, resumes(*, analyses(*))')
      .eq('auth_id', authId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw fetchError;
    }

    // Fetch job matches separately to bypass missing foreign key constraint in DB schema
    if (user && user.resumes && user.resumes.length > 0) {
      const resumeIds = user.resumes.map((r: any) => r.id);
      const { data: jobMatches, error: matchesError } = await supabase
        .from('job_matches')
        .select('*')
        .in('resumeId', resumeIds);

      if (!matchesError && jobMatches) {
        user.resumes.forEach((resume: any) => {
          resume.jobMatches = jobMatches.filter(
            (m: any) => m.resumeId === resume.id || m.resume_id === resume.id
          );
        });
      } else {
        user.resumes.forEach((resume: any) => {
          resume.jobMatches = [];
        });
      }
    }

    // Prisma's orderBy: { createdAt: 'desc' } needs to be handled.
    // Supabase returns nested relations. We might need to sort them manually if we can't do it in the query easily for all levels.
    if (user && user.resumes) {
      user.resumes.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json(user);
  } catch (error) {
    const errorMsg = `FETCH DASHBOARD ERROR: ${error instanceof Error ? error.stack : JSON.stringify(error)}\n`;
    console.error(errorMsg);
    try {
      const logFile = path.join(__dirname, '../../debug.log');
      fs.appendFileSync(logFile, `${new Date().toISOString()} | ERROR | ${errorMsg}`);
    } catch (e) {}
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});


export default router;
