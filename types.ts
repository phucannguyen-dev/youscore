export enum ExamType {
  QUIZ = 'Quiz',
  MIDTERM = 'Midterm',
  FINAL = 'Final',
  ASSIGNMENT = 'Assignment',
  PROJECT = 'Project',
  OTHER = 'Other'
}

export type Language = 'vi' | 'en';

export interface ScoreEntry {
  id: string;
  subject: string;
  examType: string;
  score: number;
  maxScore: number;
  timestamp: number;
  originalText: string;
}

export interface ScoreAnalysis {
  average: number;
  highest: number;
  totalTests: number;
  recentTrend: 'up' | 'down' | 'stable';
}

export interface CustomFactor {
  id: string;
  name: string;
  multiplier: number;
}

export interface AppSettings {
  sortOption: 'date_desc' | 'date_asc' | 'subject_asc' | 'subject_desc' | 'score_high' | 'score_low';
  rounding: 0 | 1 | 2;
  showDates: boolean;
  defaultMaxScore: number;
  semestersPerYear: number;
  customFactors: CustomFactor[];
  language: Language;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  language: Language;
  created_at: string;
  updated_at: string;
}