import React, { useState, useEffect, useRef } from 'react';
import { ScoreEntry, ExamType } from '../types';
import { Trash2, Calendar, CheckCircle, AlertCircle, ChevronDown, Pencil, Check, X, Square, CheckSquare } from 'lucide-react';

interface ScoreCardProps {
  entry: ScoreEntry;
  onDelete: (id: string) => void;
  rounding: number;
  showDate: boolean;
  availableTypes: string[];
  onUpdate: (id: string, updates: Partial<ScoreEntry>) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const getScoreColor = (percentage: number) => {
  if (percentage >= 90) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
  if (percentage >= 75) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
  if (percentage >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
  return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
};

const getIcon = (percentage: number) => {
    if (percentage >= 60) return <CheckCircle className="w-4 h-4 mr-1" />;
    return <AlertCircle className="w-4 h-4 mr-1" />;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ 
  entry, 
  onDelete, 
  rounding, 
  showDate, 
  availableTypes, 
  onUpdate,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({ score: '', max: '' });
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  
  // Swipe gesture state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  
  // Swipe gesture constants
  const SWIPE_THRESHOLD = 100; // pixels
  const MAX_SWIPE_DISTANCE = 150; // pixels

  const percentage = (entry.score / entry.maxScore) * 100;
  const colorClass = getScoreColor(percentage);
  
  const dateObj = new Date(entry.timestamp);
  const dateDisplay = dateObj.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  // Format for input type="date" (YYYY-MM-DD) in local time
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const dateInputValue = `${year}-${month}-${day}`;

  const startEditing = (e: React.MouseEvent) => {
      if (isSelectMode) return;
      e.stopPropagation();
      setEditValues({ score: entry.score.toString(), max: entry.maxScore.toString() });
      setIsEditing(true);
  };

  useEffect(() => {
      if (isEditing && inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
      }
  }, [isEditing]);

  useEffect(() => {
      if (isEditingSubject && subjectInputRef.current) {
          subjectInputRef.current.focus();
          subjectInputRef.current.select();
      }
  }, [isEditingSubject]);

  const saveEdit = () => {
      const s = parseFloat(editValues.score);
      const m = parseFloat(editValues.max);
      if (!isNaN(s) && !isNaN(m) && m > 0) {
          onUpdate(entry.id, { score: s, maxScore: m });
      }
      setIsEditing(false);
  };

  const cancelEdit = () => {
      setIsEditing(false);
  };

  const startEditingSubject = (e: React.MouseEvent) => {
      if (isSelectMode) return;
      e.stopPropagation();
      setEditSubject(entry.subject);
      setIsEditingSubject(true);
  };

  const saveSubjectEdit = () => {
      if (editSubject.trim() && editSubject.trim() !== entry.subject) {
          onUpdate(entry.id, { subject: editSubject.trim() });
      }
      setIsEditingSubject(false);
  };

  const cancelSubjectEdit = () => {
      setIsEditingSubject(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') saveEdit();
      if (e.key === 'Escape') cancelEdit();
  };

  const handleSubjectKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') saveSubjectEdit();
      if (e.key === 'Escape') cancelSubjectEdit();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (!val) return;
      // Create date object treating input as local date (YYYY-MM-DD -> Local Midnight)
      const [y, m, d] = val.split('-').map(Number);
      const newDate = new Date(y, m - 1, d);
      onUpdate(entry.id, { timestamp: newDate.getTime() });
  };

  const handleCardClick = () => {
    if (isSelectMode && onToggleSelect) {
      onToggleSelect(entry.id);
    }
  };

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSelectMode || isEditing) return;
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isSelectMode || isEditing || touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const swipeDistance = touchStartX - currentX;
    
    // Only prevent default if user is swiping left (to avoid interfering with scroll)
    if (swipeDistance > 0) {
      e.preventDefault();
    }
    
    setTouchCurrentX(currentX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isSelectMode || isEditing || touchStartX === null) {
      setTouchStartX(null);
      setTouchCurrentX(null);
      setIsSwiping(false);
      return;
    }

    const swipeDistance = touchStartX - (touchCurrentX || touchStartX);
    
    if (swipeDistance > SWIPE_THRESHOLD) {
      // Swiped left - delete
      e.stopPropagation();
      onDelete(entry.id);
    }
    
    // Reset swipe state
    setTouchStartX(null);
    setTouchCurrentX(null);
    setIsSwiping(false);
  };

  // Calculate swipe offset for visual feedback
  const getSwipeOffset = () => {
    if (!isSwiping || touchStartX === null || touchCurrentX === null) return 0;
    const offset = touchCurrentX - touchStartX;
    // Only allow left swipe (negative offset), limit to -MAX_SWIPE_DISTANCE
    return Math.max(Math.min(offset, 0), -MAX_SWIPE_DISTANCE);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Red delete background trail */}
      {isSwiping && (
        <div 
          className="absolute inset-0 bg-red-500 dark:bg-red-600 flex items-center justify-end pr-6"
          style={{
            opacity: Math.min(Math.abs(getSwipeOffset()) / SWIPE_THRESHOLD, 1)
          }}
        >
          <Trash2 className="w-6 h-6 text-white" />
        </div>
      )}
      
      <div 
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${getSwipeOffset()}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
        }}
        className={`bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 shadow-sm border transition-all hover:shadow-md flex items-center justify-between gap-2 sm:gap-4 group break-inside-avoid relative ${
          isSelectMode ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''
        } ${
          isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 dark:border-indigo-400 dark:ring-indigo-400' : 'border-slate-100 dark:border-slate-800'
        }`}
      >
      {/* Selection Checkbox */}
      {isSelectMode && (
        <div className="mr-2 sm:mr-4 text-indigo-600 dark:text-indigo-400">
          {isSelected ? <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" /> : <Square className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 dark:text-slate-600" />}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1 gap-2">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <div className="relative group/badge">
                <span className={`px-1.5 sm:px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wide flex items-center gap-1 cursor-pointer ${
                entry.examType === ExamType.FINAL 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}>
                {entry.examType}
                {!isSelectMode && <ChevronDown className="w-2 h-2 sm:w-3 sm:h-3 opacity-50" />}
                </span>
                {!isSelectMode && (
                  <select
                      value={entry.examType}
                      onChange={(e) => onUpdate(entry.id, { examType: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onClick={(e) => e.stopPropagation()}
                  >
                      {availableTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                      ))}
                  </select>
                )}
            </div>

            {showDate && (
              <div className="relative group/date">
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center group-hover/date:text-indigo-500 dark:group-hover/date:text-indigo-400 transition-colors cursor-pointer" title={dateDisplay}>
                    <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    {dateDisplay}
                  </span>
                  {!isSelectMode && (
                    <input
                      type="date"
                      value={dateInputValue}
                      onChange={handleDateChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
              </div>
            )}
          </div>
        </div>
        
        {/* Subject - Now Editable */}
        {isEditingSubject ? (
          <div className="flex items-center gap-2 mb-1" onClick={e => e.stopPropagation()}>
            <input 
              ref={subjectInputRef}
              type="text" 
              value={editSubject}
              onChange={e => setEditSubject(e.target.value)}
              onKeyDown={handleSubjectKeyDown}
              className="flex-1 text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border-b-2 border-indigo-500 focus:outline-none px-1 py-0.5"
            />
            <button onClick={saveSubjectEdit} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button onClick={cancelSubjectEdit} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 group/subject mb-1">
            <h3 
              onClick={startEditingSubject}
              className={`text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 truncate ${isSelectMode ? '' : 'cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400'}`}
              title={isSelectMode ? entry.subject : `${entry.subject} (Click to edit)`}
            >
              {entry.subject}
            </h3>
            {!isSelectMode && (
              <Pencil className="w-3 h-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover/subject:opacity-100 transition-opacity" />
            )}
          </div>
        )}
        
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic truncate print:hidden" title={entry.originalText}>"{entry.originalText}"</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {isEditing ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg border bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 shadow-sm animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <input 
                    ref={inputRef}
                    type="number" 
                    value={editValues.score}
                    onChange={e => setEditValues(prev => ({...prev, score: e.target.value}))}
                    onKeyDown={handleKeyDown}
                    className="w-10 sm:w-12 text-right bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white p-0"
                    step="any"
                />
                <span className="text-slate-400 text-xs sm:text-sm">/</span>
                <input 
                    type="number" 
                    value={editValues.max}
                    onChange={e => setEditValues(prev => ({...prev, max: e.target.value}))}
                    onKeyDown={handleKeyDown}
                    className="w-10 sm:w-12 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none text-xs sm:text-sm text-slate-500 p-0"
                    step="any"
                />
                <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded ml-1"><Check className="w-3 h-3" /></button>
                <button onClick={cancelEdit} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><X className="w-3 h-3" /></button>
            </div>
        ) : (
            <div 
                onClick={startEditing}
                className={`relative flex flex-col items-end px-2 sm:px-3 py-1 rounded-lg border ${colorClass} transition-all group/score select-none ${isSelectMode ? '' : 'cursor-pointer hover:brightness-95'}`}
                title={isSelectMode ? undefined : "Click to edit marks"}
            >
                {!isSelectMode && (
                  <div className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm border border-slate-200 dark:border-slate-700 opacity-0 group-hover/score:opacity-100 transition-opacity z-10">
                      <Pencil className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />
                  </div>
                )}
                <div className="flex items-center font-bold text-base sm:text-lg">
                    {getIcon(percentage)}
                    {Number(entry.score.toFixed(rounding))}
                    <span className="text-xs opacity-70 font-normal ml-0.5">/{entry.maxScore}</span>
                </div>
                <span className="text-xs font-semibold">{percentage.toFixed(0)}%</span>
            </div>
        )}

        {!isSelectMode && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
            className="p-1.5 sm:p-2 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 print:hidden hidden sm:block"
            aria-label="Xóa điểm"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>
    </div>
    </div>
  );
};