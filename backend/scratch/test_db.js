const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey?.length);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('User').select('count', { count: 'exact', head: true });
  if (error) {
    console.error('Error:', error);
    const { data: data2, error: error2 } = await supabase.from('user').select('count', { count: 'exact', head: true });
    if (error2) {
      console.error('Error with lowercase:', error2);
    } else {
      console.log('Success with lowercase!');
    }
  } else {
    console.log('Success with TitleCase!');
  }
}

test();
