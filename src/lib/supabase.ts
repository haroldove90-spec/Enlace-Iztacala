import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fbtswlienezmvubcfkbq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidHN3bGllbmV6bXZ1YmNma2JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDkyMTUsImV4cCI6MjA5MTkyNTIxNX0.Zm5MOk1Y_YM_8nE1BA7J5ArAVqPsvqXLS6A463OJgw0';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
