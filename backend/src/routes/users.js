import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = path.join(__dirname, '../../debug.log');
const router = Router();
// Get user profile or create if not exists
router.post('/sync', async (req, res) => {
    try {
        const { authId, email, name } = req.body;
        if (!authId || !email) {
            return res.status(400).json({
                success: false,
                data: null,
                error: {
                    message: 'authId and email are required',
                    code: 'BAD_REQUEST'
                }
            });
        }
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authId)
            .maybeSingle();
        if (fetchError) {
            throw fetchError;
        }
        if (!user) {
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([{ auth_id: authId, email, name }])
                .select()
                .single();
            if (createError)
                throw createError;
            return res.json({
                success: true,
                data: newUser,
                error: null
            });
        }
        res.json({
            success: true,
            data: user,
            error: null
        });
    }
    catch (error) {
        const errorMsg = `SYNC USER ERROR: ${error instanceof Error ? error.stack : JSON.stringify(error)}\n`;
        console.error(errorMsg);
        try {
            fs.appendFileSync(logFile, `${new Date().toISOString()} | ERROR | ${errorMsg}`);
        }
        catch (e) { }
        res.status(500).json({
            success: false,
            data: null,
            error: {
                message: 'Internal server error during sync',
                code: 'INTERNAL_SERVER_ERROR'
            }
        });
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
            .maybeSingle();
        if (fetchError) {
            throw fetchError;
        }
        if (!user) {
            return res.status(404).json({
                success: false,
                data: null,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }
        // Fetch job matches separately to bypass missing foreign key constraint in DB schema
        if (user && user.resumes && user.resumes.length > 0) {
            const resumeIds = user.resumes.map((r) => r.id);
            const { data: jobMatches, error: matchesError } = await supabase
                .from('job_matches')
                .select('*')
                .in('resumeId', resumeIds);
            if (!matchesError && jobMatches) {
                user.resumes.forEach((resume) => {
                    resume.jobMatches = jobMatches.filter((m) => m.resumeId === resume.id || m.resume_id === resume.id);
                });
            }
            else {
                user.resumes.forEach((resume) => {
                    resume.jobMatches = [];
                });
            }
        }
        // Sort resumes descending
        if (user && user.resumes) {
            user.resumes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        res.json({
            success: true,
            data: user,
            error: null
        });
    }
    catch (error) {
        const errorMsg = `FETCH DASHBOARD ERROR: ${error instanceof Error ? error.stack : JSON.stringify(error)}\n`;
        console.error(errorMsg);
        try {
            fs.appendFileSync(logFile, `${new Date().toISOString()} | ERROR | ${errorMsg}`);
        }
        catch (e) { }
        res.status(500).json({
            success: false,
            data: null,
            error: {
                message: 'Internal server error during fetch dashboard',
                code: 'INTERNAL_SERVER_ERROR'
            }
        });
    }
});
export default router;
//# sourceMappingURL=users.js.map