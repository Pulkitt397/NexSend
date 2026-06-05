import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabase: SupabaseClient;

function initSupabase() {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    });
  }
  return supabase;
}

export function getSupabase(): SupabaseClient {
  return initSupabase();
}

export async function ensureAuth(): Promise<string> {
  const client = initSupabase();
  const { data: { session } } = await client.auth.getSession();
  if (session?.user) return session.user.id;

  // Supabase anonymous sign-in
  const { data, error } = await client.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error('Failed to authenticate');
  return data.user.id;
}
