const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('clerkId', 'user_test_guest')
    .single();
  console.log('User found:', user);
  process.exit(0);
}

checkUser();
