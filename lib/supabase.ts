import { createClient, User, Session } from '@supabase/supabase-js';
import { Language, UserProfile, AppSettings } from '../types';

// Database schema type for the scores table
export interface Score {
  id: string;
  created_at: string;
  subject: string;
  score: number;
  max_score: number;
  exam_type: string;
  original_text: string | null;
  timestamp: number;
  user_id: string;
}

// Database schema for user_settings table
export interface UserSettings {
  id: string;
  user_id: string;
  settings: AppSettings;
  created_at: string;
  updated_at: string;
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth types
export type { User, Session };

/**
 * Add a new score to the database
 * @param score - Score data without id, created_at, and user_id (auto-generated)
 * @returns Promise with the inserted score or error
 */
export async function addScore(score: Omit<Score, 'id' | 'created_at' | 'user_id'>): Promise<Score | null> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user');
      return null;
    }

    const { data, error } = await supabase
      .from('scores')
      .insert([{
        subject: score.subject,
        score: score.score,
        max_score: score.max_score,
        exam_type: score.exam_type,
        original_text: score.original_text,
        timestamp: score.timestamp,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding score:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception adding score:', err);
    return null;
  }
}

/**
 * Fetch all scores from the database, ordered by timestamp (newest first)
 * @returns Promise with array of scores
 */
export async function getScores(): Promise<Score[]> {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching scores:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception fetching scores:', err);
    return [];
  }
}

/**
 * Delete a score from the database
 * @param id - Score ID to delete
 * @returns Promise with success boolean
 */
export async function deleteScore(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('scores')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting score:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception deleting score:', err);
    return false;
  }
}

/**
 * Authentication Functions
 */

/**
 * Sign up a new user with email and password
 * @param email - User's email
 * @param password - User's password
 * @returns Promise with user data or error
 */
export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Error signing up:', error);
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (err) {
    console.error('Exception during sign up:', err);
    return { user: null, error: err };
  }
}

/**
 * Sign in an existing user with email and password
 * @param email - User's email
 * @param password - User's password
 * @returns Promise with session data or error
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error);
      return { session: null, error };
    }

    return { session: data.session, error: null };
  } catch (err) {
    console.error('Exception during sign in:', err);
    return { session: null, error: err };
  }
}

/**
 * Sign out the current user
 * @returns Promise with error if any
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      return { error };
    }

    return { error: null };
  } catch (err) {
    console.error('Exception during sign out:', err);
    return { error: err };
  }
}

/**
 * Get the current user session
 * @returns Promise with session data
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return { session: null, error };
    }

    return { session: data.session, error: null };
  } catch (err) {
    console.error('Exception getting session:', err);
    return { session: null, error: err };
  }
}

/**
 * Get the current user
 * @returns Promise with user data
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting user:', error);
      return { user: null, error };
    }

    return { user, error: null };
  } catch (err) {
    console.error('Exception getting user:', err);
    return { user: null, error: err };
  }
}

/**
 * Listen to auth state changes
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}

/**
 * User Profile Functions
 */

/**
 * Get user profile
 * @returns Promise with user profile or null
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception fetching user profile:', err);
    return null;
  }
}

/**
 * Create or update user profile
 * @param profile - Profile data
 * @returns Promise with updated profile or null
 */
export async function upsertUserProfile(profile: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        ...profile,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user profile:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception upserting user profile:', err);
    return null;
  }
}

/**
 * User Settings Functions
 */

/**
 * Get user settings from database
 * @returns Promise with user settings or null
 */
export async function getUserSettings(): Promise<AppSettings | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }

    return data?.settings || null;
  } catch (err) {
    console.error('Exception fetching user settings:', err);
    return null;
  }
}

/**
 * Save user settings to database
 * @param settings - App settings to save
 * @returns Promise with success boolean
 */
export async function saveUserSettings(settings: AppSettings): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving user settings:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception saving user settings:', err);
    return false;
  }
}
