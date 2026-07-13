-- SQL Script to Create Performance Optimization Indexes on Supabase Database

-- 1. Index on users(auth_id) for fast user lookup and profile syncing
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);

-- 2. Index on resumes(userId) for fast retrieval of user history on dashboard load
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes("userId");

-- 3. Index on resumes(textHash) to optimize duplicate resume checks
CREATE INDEX IF NOT EXISTS idx_resumes_text_hash ON public.resumes("textHash");

-- 4. Index on analyses(resumeId) to quickly retrieve ATS scores and feedback
CREATE INDEX IF NOT EXISTS idx_analyses_resume_id ON public.analyses("resumeId");

-- 5. Index on job_matches(resumeId) to accelerate job matching queries and recommendations
CREATE INDEX IF NOT EXISTS idx_job_matches_resume_id ON public.job_matches("resumeId");
