import { createClient } from '@supabase/supabase-js';

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
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Add a new score to the database
 * @param score - Score data without id and created_at (auto-generated)
 * @returns Promise with the inserted score or error
 */
export async function addScore(score: Omit<Score, 'id' | 'created_at'>): Promise<Score | null> {
  try {
    const { data, error } = await supabase
      .from('scores')
      .insert([{
        subject: score.subject,
        score: score.score,
        max_score: score.max_score,
        exam_type: score.exam_type,
        original_text: score.original_text,
        timestamp: score.timestamp
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
