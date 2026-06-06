import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  // Try fetching schema info for each table
  const tables = ['users', 'resumes', 'analyses', 'job_matches', 'ai_chats'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table "${table}": ERROR - ${error.message}`);
    } else {
      console.log(`Table "${table}": OK - columns: ${data.length > 0 ? Object.keys(data[0]).join(', ') : '(empty, need to check schema)'}`);
    }
  }

  // Try to insert a dummy row to see column names from error
  console.log('\n--- Trying insert to users to get column info ---');
  const { data: ins, error: insErr } = await supabase
    .from('users')
    .insert([{ auth_id: 'schema-probe', email: 'probe@probe.com' }])
    .select();
  if (insErr) {
    console.log('Insert with auth_id error:', insErr.message);
  } else {
    console.log('Insert with auth_id SUCCESS:', ins);
    // Clean up
    await supabase.from('users').delete().eq('auth_id', 'schema-probe');
  }
}
run();
