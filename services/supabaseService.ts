import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
};

// Auth functions
export const signUp = async (email: string, password: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getSession = async (): Promise<Session | null> => {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  const supabase = getSupabaseClient();
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  
  return subscription;
};

// Database functions for storing scores
export const saveUserScores = async (userId: string, scores: any[]) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_scores')
    .upsert({
      user_id: userId,
      scores: scores,
      updated_at: new Date().toISOString()
    });
  
  if (error) throw error;
  return data;
};

export const getUserScores = async (userId: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_scores')
    .select('scores')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return data?.scores || [];
};

export const saveUserSettings = async (userId: string, settings: any) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      settings: settings,
      updated_at: new Date().toISOString()
    });
  
  if (error) throw error;
  return data;
};

export const getUserSettings = async (userId: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data?.settings || null;
};
