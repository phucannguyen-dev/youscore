import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Sparkles, History, GraduationCap, Moon, Sun, Settings as SettingsIcon, CheckSquare, Trash2, Camera, User as UserIcon, Search, X } from 'lucide-react';
import { parseScoreFromText, parseScoresFromImage } from './services/geminiService';
import { ScoreEntry, AppSettings, CustomFactor, Language } from './types';
import { ScoreCard } from './components/ScoreCard';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { Profile } from './components/Profile';
import { Auth } from './components/Auth';
import { addScore, getScores, deleteScore, Score, signIn, signUp, signOut, onAuthStateChange, User, upsertUserProfile, getUserSettings, saveUserSettings } from './lib/supabase';
import { useTranslation } from './lib/translations';
import { SpeedInsights } from "@vercel/speed-insights/react"

// Default factors requested by user
const DEFAULT_FACTORS: CustomFactor[] = [
    { id: '1', name: 'Học kỳ', multiplier: 3 },
    { id: '2', name: 'Giữa học kỳ', multiplier: 2 },
    { id: '3', name: 'Kiểm tra 15 phút', multiplier: 1 },
    { id: '4', name: 'Kiểm tra thường xuyên', multiplier: 1 },
    { id: '5', name: 'Khác', multiplier: 1 },
];

// Default subject list in Vietnamese
const DEFAULT_SUBJECTS: string[] = [
  'Toán',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lý',
  'Giáo dục công dân',
  'Công nghệ',
  'Tin học',
  'Thể dục',
  'Âm nhạc',
  'Mỹ thuật',
  'Giáo dục quốc phòng và an ninh',
  'Giáo dục kinh tế và pháp luật',
];

const DEFAULT_SETTINGS: AppSettings = {
  sortOption: 'date_desc',
  rounding: 1,
  showDates: true,
  defaultMaxScore: 10, // Changed from 100 to 10
  semestersPerYear: 2,
  customFactors: DEFAULT_FACTORS,
  language: 'vi' as Language,
  customSubjects: DEFAULT_SUBJECTS
};

// Helper function to convert Supabase Score to ScoreEntry
function scoreToScoreEntry(score: Score): ScoreEntry {
  return {
    id: score.id,
    subject: score.subject,
    examType: score.exam_type,
    score: score.score,
    maxScore: score.max_score,
    timestamp: score.timestamp,
    originalText: score.original_text || ''
  };
}

// Helper function to convert ScoreEntry to Supabase Score format (without id, created_at, and user_id)
function scoreEntryToScore(entry: ScoreEntry): Omit<Score, 'id' | 'created_at' | 'user_id'> {
  return {
    subject: entry.subject,
    exam_type: entry.examType,
    score: entry.score,
    max_score: entry.maxScore,
    timestamp: entry.timestamp,
    original_text: entry.originalText
  };
}


function App() {
  const [input, setInput] = useState('');
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'settings' | 'profile'>('home');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  
  // Selection State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Settings state
  const [settings, setSettings] = useState<AppSettings>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('scoresnap_settings');
          if (saved) {
            try {
                // Merge saved settings with defaults to ensure new fields (like customFactors) exist
                const parsed = JSON.parse(saved);
                // Ensure customFactors exists if loading old settings
                if (!parsed.customFactors) {
                    parsed.customFactors = DEFAULT_FACTORS;
                }
                // Ensure customSubjects exists if loading old settings
                if (!parsed.customSubjects) {
                    parsed.customSubjects = DEFAULT_SUBJECTS;
                }
                // Ensure defaultMaxScore is updated if it was the old default (100) and user hasn't changed it, 
                // but actually let's just respect the saved value unless it's missing.
                
                return { ...DEFAULT_SETTINGS, ...parsed };
            } catch(e) {
                return DEFAULT_SETTINGS;
            }
          }
      }
      return DEFAULT_SETTINGS;
  });

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('scoresnap_theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('scoresnap_theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('scoresnap_theme', 'light');
    }
  }, [isDarkMode]);

  // Load from Supabase and local storage
  useEffect(() => {
    const loadScores = async () => {
      if (!user) return;
      
      try {
        // Try to load from Supabase first
        const supabaseScores = await getScores();
        if (supabaseScores && supabaseScores.length > 0) {
          const entries = supabaseScores.map(scoreToScoreEntry);
          setScores(entries);
          // Also update localStorage with Supabase data
          localStorage.setItem('scoresnap_data', JSON.stringify(entries));
          return;
        }
      } catch (err) {
        console.error('Failed to load from Supabase, falling back to localStorage:', err);
      }

      // Fallback to localStorage if Supabase fails or is empty
      const saved = localStorage.getItem('scoresnap_data');
      if (saved) {
        try {
          setScores(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to load history from localStorage");
        }
      }
    };

    if (user) {
      loadScores();
    }
  }, [user]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      
      // Clear scores when user signs out
      if (event === 'SIGNED_OUT') {
        setScores([]);
        localStorage.removeItem('scoresnap_data');
      }
    });

    return () => unsubscribe();
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('scoresnap_data', JSON.stringify(scores));
  }, [scores]);

  // Save settings to localStorage only (manual save to Supabase via button)
  useEffect(() => {
    localStorage.setItem('scoresnap_settings', JSON.stringify(settings));
  }, [settings]);

  // Manual save settings to Supabase
  const handleSaveSettings = async () => {
    if (user) {
      const success = await saveUserSettings(settings);
      if (success) {
        // Show success feedback if needed
        console.log('Settings saved to cloud');
      }
    }
  };

  // Load settings from Supabase when user logs in
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) return;
      
      const userSettings = await getUserSettings();
      if (userSettings) {
        setSettings(userSettings);
      }
    };
    
    loadUserSettings();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Extract factor names for the AI prompt
      const availableFactors = settings.customFactors.map(f => f.name);
      
      const result = await parseScoreFromText(input, settings.defaultMaxScore, availableFactors, settings.customSubjects);
      
      if (result) {
        const newEntry: ScoreEntry = {
          ...result,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          originalText: input
        };
        
        // Save to Supabase
        const scoreData = scoreEntryToScore(newEntry);
        const savedScore = await addScore(scoreData);
        
        // If Supabase save succeeded, use the returned data (with DB-generated id)
        // Otherwise, use the local entry
        if (savedScore) {
          const entryWithDbId = scoreToScoreEntry(savedScore);
          setScores(prev => [entryWithDbId, ...prev]);
        } else {
          // Fallback: save locally even if Supabase fails
          setScores(prev => [newEntry, ...prev]);
        }
        
        setInput('');
        // Scroll to top of list smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError("Could not understand the score. Try 'Subject score was X/Y'");
      }
    } catch (err) {
      setError("Something went wrong. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert to Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g. "data:image/jpeg;base64,")
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const availableFactors = settings.customFactors.map(f => f.name);
      const results = await parseScoresFromImage(base64Data, file.type, settings.defaultMaxScore, availableFactors, settings.customSubjects);

      if (results && results.length > 0) {
        const newEntries: ScoreEntry[] = results.map(r => ({
          ...r,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          originalText: "Scanned Image"
        }));

        // Save each entry to Supabase
        const savedEntries: ScoreEntry[] = [];
        for (const entry of newEntries) {
          const scoreData = scoreEntryToScore(entry);
          const savedScore = await addScore(scoreData);
          
          if (savedScore) {
            savedEntries.push(scoreToScoreEntry(savedScore));
          } else {
            // Fallback to local entry if Supabase fails
            savedEntries.push(entry);
          }
        }

        setScores(prev => [...savedEntries, ...prev]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError("No scores found in the image. Please try a clearer photo.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to process the image. Please try again.");
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string) => {
    // Delete from Supabase if user is logged in
    if (user) {
      await deleteScore(id);
    }
    // Also remove from local state
    setScores(prev => prev.filter(s => s.id !== id));
  };
  
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedIds(new Set());
  };
  
  const handleToggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };
  
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    if (window.confirm(`Bạn có muốn xóa ${selectedIds.size}?`)) {
      // Delete from Supabase if user is logged in
      if (user) {
        // Delete each score from Supabase
        for (const id of selectedIds) {
          await deleteScore(id);
        }
      }
      // Remove from local state
      setScores(prev => prev.filter(s => !selectedIds.has(s.id)));
      setIsSelectMode(false);
      setSelectedIds(new Set());
    }
  };

  const handleUpdateScore = (id: string, updates: Partial<ScoreEntry>) => {
    setScores(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // Auth handlers
  const handleSignIn = async (email: string, password: string, language: Language) => {
    setAuthMessage(null);
    setAuthLoading(true);
    
    const { session, error } = await signIn(email, password);
    
    if (error) {
      const t = useTranslation(language);
      setAuthMessage({ text: t.invalidCredentials, type: 'error' });
    } else if (session) {
      setUser(session.user);
      // Update language preference
      await upsertUserProfile({ language });
    }
    
    setAuthLoading(false);
  };

  const handleSignUp = async (email: string, password: string, language: Language) => {
    setAuthMessage(null);
    setAuthLoading(true);
    
    const { user: newUser, error } = await signUp(email, password);
    
    if (error) {
      const t = useTranslation(language);
      setAuthMessage({ text: t.accountCreationFailed, type: 'error' });
    } else if (newUser) {
      // Create user profile with selected language
      await upsertUserProfile({ language });
      const t = useTranslation(language);
      setAuthMessage({ text: t.checkEmail, type: 'success' });
    }
    
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setScores([]);
    localStorage.removeItem('scoresnap_data');
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleExport = () => {
      // Switch to home view to render the dashboard and list for printing
      setCurrentView('home');
      // Small timeout to allow React to render the Home view before printing
      setTimeout(() => {
          window.print();
      }, 100);
  };

  // Sorting Logic
  const sortedScores = useMemo(() => {
      const sorted = [...scores];
      switch (settings.sortOption) {
          case 'date_desc':
              return sorted.sort((a, b) => b.timestamp - a.timestamp);
          case 'date_asc':
              return sorted.sort((a, b) => a.timestamp - b.timestamp);
          case 'subject_asc':
              return sorted.sort((a, b) => a.subject.localeCompare(b.subject));
          case 'subject_desc':
              return sorted.sort((a, b) => b.subject.localeCompare(a.subject));
          case 'score_high':
              return sorted.sort((a, b) => (b.score / b.maxScore) - (a.score / a.maxScore));
          case 'score_low':
              return sorted.sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore));
          default:
              return sorted;
      }
  }, [scores, settings.sortOption]);

  // Search and Filter Logic
  const filteredScores = useMemo(() => {
    if (!searchQuery.trim()) return sortedScores;
    
    const query = searchQuery.toLowerCase().trim();
    return sortedScores.filter(score => 
      score.subject.toLowerCase().includes(query) ||
      score.examType.toLowerCase().includes(query) ||
      score.originalText.toLowerCase().includes(query) ||
      score.score.toString().includes(query)
    );
  }, [sortedScores, searchQuery]);

  // Derived available factors list
  const availableFactors = useMemo(() => settings.customFactors.map(f => f.name), [settings.customFactors]);

  // Show auth screen if user is not logged in
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Auth
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        message={authMessage}
        isLoading={authLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 md:pb-32 relative font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300">
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 bg-opacity-80 dark:bg-opacity-80 backdrop-blur-md transition-colors print:hidden">
        <div className="mx-auto px-4 h-16 flex items-center justify-between lg:max-w-7xl md:max-w-4xl max-w-2xl">
          <div 
            className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 cursor-pointer"
            onClick={() => setCurrentView('home')}
          >
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm">
                <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">YouScore</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md mr-1 hidden sm:block">
                Beta
            </div>
            <button 
                onClick={() => setCurrentView(currentView === 'profile' ? 'home' : 'profile')}
                className={`p-1.5 sm:p-2 rounded-full transition-colors ${currentView === 'profile' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                aria-label="Hồ sơ"
                title="Hồ sơ cá nhân"
            >
                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
                onClick={() => setCurrentView(currentView === 'settings' ? 'home' : 'settings')}
                className={`p-1.5 sm:p-2 rounded-full transition-colors ${currentView === 'settings' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                aria-label="Cài đặt"
                title="Cài đặt"
            >
                <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                aria-label="Giao diện"
            >
                {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 py-6 print:px-0 print:py-0 print:max-w-none lg:max-w-7xl md:max-w-4xl max-w-2xl">
        
        {currentView === 'home' ? (
          <>
             {/* Print Header */}
            <div className="hidden print:block mb-6 text-center">
                <h1 className="text-3xl font-bold text-black">Báo cáo của YouScore</h1>
                <p className="text-gray-500">Tạo bởi {new Date().toLocaleDateString()}</p>
            </div>

            {/* Welcome / Empty State */}
            {scores.length === 0 && !isLoading && (
              <div className="text-center py-12 space-y-4 print:hidden">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Theo dõi điểm của bạn</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Chỉ cần cho tôi biết điểm của bạn, và tôi sẽ sắp xếp <br/>
                  <span className="italic text-slate-400 dark:text-slate-500 text-sm mt-2 block">"Tôi được 10 điểm Toán cuối học kỳ"</span>
                </p>
              </div>
            )}

            {/* Desktop: Two-column layout, Mobile: Single column */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
              {/* Left Column: Dashboard (Summary & Subject Groups) */}
              <div className="lg:sticky lg:top-20">
                <Dashboard 
                    scores={filteredScores}
                    isDarkMode={isDarkMode} 
                    rounding={settings.rounding} 
                    customFactors={settings.customFactors}
                    defaultMaxScore={settings.defaultMaxScore}
                    semestersPerYear={settings.semestersPerYear}
                    semesterDurations={settings.semesterDurations}
                    searchQuery={searchQuery}
                />
              </div>

              {/* Right Column: History (Score List) */}
              <div>
                {/* Search Bar */}
                {scores.length > 0 && (
                  <div className="mb-4 print:hidden">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm môn học, loại bài kiểm tra..."
                        className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm rounded-lg py-2.5 pl-10 pr-10 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {searchQuery && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 px-1">
                        Tìm thấy {filteredScores.length} kết quả
                      </p>
                    )}
                  </div>
                )}
                
                {/* Recent List Header */}
                {scores.length > 0 && (
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <History className="w-4 h-4" /> Lịch sử
                        </h2>
                        <div className="flex gap-2 print:hidden">
                          {isSelectMode ? (
                            <button 
                              onClick={() => {
                                if (selectedIds.size === scores.length) {
                                  setSelectedIds(new Set());
                                } else {
                                  setSelectedIds(new Set(scores.map(s => s.id)));
                                }
                              }}
                              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              {selectedIds.size === scores.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </button>
                          ) : (
                            <button 
                              onClick={toggleSelectMode}
                              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                            >
                              <CheckSquare className="w-3.5 h-3.5" /> Chọn
                            </button>
                          )}
                        </div>
                    </div>
                )}

                {/* Score List */}
                <div className="space-y-3 mb-24 lg:mb-32 print:mb-0">
                  {isLoading && (
                     <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-indigo-100 dark:border-indigo-900/30 animate-pulse flex gap-4">
                        <div className="flex-1 space-y-3">
                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4"></div>
                            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
                        </div>
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                     </div>
                  )}
                  
                  {filteredScores.map(score => (
                    <ScoreCard 
                        key={score.id} 
                        entry={score} 
                        onDelete={handleDelete} 
                        rounding={settings.rounding}
                        showDate={settings.showDates}
                        availableTypes={availableFactors}
                        onUpdate={handleUpdateScore}
                        isSelectMode={isSelectMode}
                        isSelected={selectedIds.has(score.id)}
                        onToggleSelect={handleToggleSelection}
                    />
                  ))}
                  <div ref={bottomRef} />
                </div>
              </div>
            </div>
          </>
        ) : currentView === 'settings' ? (
          <Settings 
            onBack={() => setCurrentView('home')} 
            settings={settings}
            onUpdateSettings={setSettings}
            onExport={handleExport}
            onSaveSettings={handleSaveSettings}
          />
        ) : (
          <Profile 
            onBack={() => setCurrentView('home')}
            onAccountDeleted={handleSignOut}
            onSignOut={handleSignOut}
          />
        )}

      </main>

      {/* Input Area or Bulk Actions - Sticky Bottom (Only on Home) */}
      {currentView === 'home' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 pb-6 md:pb-4 z-20 transition-colors print:hidden">
           <div className="mx-auto relative lg:max-w-7xl md:max-w-4xl max-w-2xl">
              {error && !isSelectMode && (
                  <div className="absolute -top-16 left-0 right-0 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-300 text-xs py-2 px-3 rounded-lg border border-red-100 dark:border-red-800 text-center mb-2">
                      {error}
                  </div>
              )}
              
              {isSelectMode ? (
                <div className="flex items-center justify-between animate-in slide-in-from-bottom-5">
                   <div className="flex items-center gap-4">
                      <button 
                        onClick={toggleSelectMode}
                        className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Hủy
                      </button>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Đã chọn {selectedIds.size}
                      </span>
                   </div>
                   <button 
                      onClick={handleBulkDelete}
                      disabled={selectedIds.size === 0}
                      className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900/30 text-white text-sm font-medium transition-colors flex items-center gap-2 shadow-md shadow-red-200 dark:shadow-none"
                   >
                      <Trash2 className="w-4 h-4" />
                      Xóa ({selectedIds.size})
                   </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 p-1.5 sm:p-2 transition-colors rounded-full"
                        title="Upload score image"
                        disabled={isLoading}
                    >
                        <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileSelect}
                    />

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Nhập 'Được 10 điểm Toán' hoặc tải lên bảng điểm"
                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base rounded-full py-2.5 sm:py-3 pl-10 sm:pl-12 pr-10 sm:pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 transition-all"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white p-1.5 sm:p-2 rounded-full transition-colors shadow-md"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                        )}
                    </button>
                </form>
              )}
           </div>
        </div>
      )}

    </div>
  );
}

export default App;
