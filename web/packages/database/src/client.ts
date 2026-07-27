import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dotjlikaurcjwabarqcy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdGpsaWthdXJjandhYmFycWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwODY5MTQsImV4cCI6MjA4MDY2MjkxNH0.zZ0GeY_sV0TtP9jGVQRKPoXoDBCSpyNDlRKruAisa9A';

// Create Supabase client for web
// The hand-maintained schema interfaces are used for application models. The
// query client remains unparameterized because Supabase's generated client
// contract also requires relationship metadata that this legacy schema file
// does not contain.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Create admin client (for server-side operations)
export const createAdminClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    console.warn('Service role key not found, using anon key');
    return supabase;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export default supabase;


