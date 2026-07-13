import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('--- Testing resumes columns ---');
  const cols = ['id', 'user_id', 'userId', 'text', 'text_hash', 'textHash', 'original_name', 'originalName', 'created_at', 'createdAt'];
  for (const col of cols) {
    const { data, error } = await supabase.from('resumes').select(col).limit(1);
    if (error) {
      console.log(`resumes.${col}: ERROR - ${error.message} (${error.code})`);
    } else {
      console.log(`resumes.${col}: OK`);
    }
  }

  console.log('\n--- Testing analyses columns ---');
  const analCols = ['id', 'resume_id', 'resumeId', 'score', 'summary', 'strengths', 'weaknesses', 'missing_keywords', 'missingKeywords', 'suggestions', 'formatting_issues', 'formattingIssues', 'created_at', 'createdAt'];
  for (const col of analCols) {
    const { data, error } = await supabase.from('analyses').select(col).limit(1);
    if (error) {
      console.log(`analyses.${col}: ERROR - ${error.message} (${error.code})`);
    } else {
      console.log(`analyses.${col}: OK`);
    }
  }
}

test();
