import React, { useMemo, useState } from 'react';
import { ScoreEntry, CustomFactor, SemesterDuration } from '../types';
import { TrendingUp, Award, BookOpen, Calendar } from 'lucide-react';

interface DashboardProps {
  scores: ScoreEntry[];
  isDarkMode: boolean;
  rounding: number;
  customFactors: CustomFactor[];
  defaultMaxScore: number;
  semestersPerYear: number;
  semesterDurations?: SemesterDuration[];
}

export const Dashboard: React.FC<DashboardProps> = ({ scores, isDarkMode, rounding, customFactors, defaultMaxScore, semestersPerYear, semesterDurations }) => {
  const [selectedSemester, setSelectedSemester] = useState<'all' | number>('all');
  
  // Calculate semester for each score based on timestamp
  const scoresWithSemester = useMemo(() => {
    return scores.map(score => {
      const date = new Date(score.timestamp);
      const month = date.getMonth() + 1; // 1-12
      
      // Determine semester based on month and semesterDurations if available
      let semester = 1;
      
      if (semesterDurations && semesterDurations.length > 0) {
        // Use custom semester durations from settings
        for (let i = 0; i < semesterDurations.length; i++) {
          const duration = semesterDurations[i];
          
          // Handle semester that spans across year boundary (e.g., Sept-Dec or Dec-Feb)
          if (duration.startMonth <= duration.endMonth) {
            // Normal range within same year (e.g., 1-6, 9-12)
            if (month >= duration.startMonth && month <= duration.endMonth) {
              semester = i + 1;
              break;
            }
          } else {
            // Range that crosses year boundary (e.g., 9-6 means Sept-June next year)
            if (month >= duration.startMonth || month <= duration.endMonth) {
              semester = i + 1;
              break;
            }
          }
        }
      } else {
        // Fallback to simple logic (assuming Vietnamese school year: Sept-June)
        if (semestersPerYear === 2) {
          // Semester 1: Sept-Dec (9-12), Semester 2: Jan-June (1-6)
          semester = (month >= 9 && month <= 12) ? 1 : 2;
        } else if (semestersPerYear === 3) {
          // Semester 1: Sept-Dec, Semester 2: Jan-Apr, Semester 3: May-Aug
          if (month >= 9 && month <= 12) semester = 1;
          else if (month >= 1 && month <= 4) semester = 2;
          else semester = 3;
        } else if (semestersPerYear === 4) {
          // Semester 1: Sept-Nov, Semester 2: Dec-Feb, Semester 3: Mar-May, Semester 4: Jun-Aug
          if (month >= 9 && month <= 11) semester = 1;
          else if (month === 12 || (month >= 1 && month <= 2)) semester = 2;
          else if (month >= 3 && month <= 5) semester = 3;
          else semester = 4;
        }
      }
      
      return { ...score, semester };
    });
  }, [scores, semestersPerYear, semesterDurations]);

  // Filter scores by selected semester
  const filteredScores = useMemo(() => {
    if (selectedSemester === 'all') return scoresWithSemester;
    return scoresWithSemester.filter(s => s.semester === selectedSemester);
  }, [scoresWithSemester, selectedSemester]);

  const stats = useMemo(() => {
    if (filteredScores.length === 0) return { average: 0, total: 0, bestSubject: 'N/A', subjectData: [] };
    
    const total = filteredScores.length;
    
    // Weighted Average Calculation Variables
    let totalWeightedScore = 0;
    let totalWeightedMax = 0;

    // Map for O(1) lookup of factors
    const factorMap = new Map<string, number>(
      customFactors.map(f => [f.name, f.multiplier])
    );

    // Structure to hold per-subject aggregation
    const subjectMap = new Map<string, { weightedScore: number; weightedMax: number; entries: ScoreEntry[] }>();

    filteredScores.forEach(s => {
        // Find multiplier for this exam type, default to 1 if not found
        const multiplier = factorMap.get(s.examType) || 1;
        
        // Global Accumulation
        totalWeightedScore += (s.score * multiplier);
        totalWeightedMax += (s.maxScore * multiplier);

        // Per Subject Accumulation
        if (!subjectMap.has(s.subject)) {
            subjectMap.set(s.subject, { weightedScore: 0, weightedMax: 0, entries: [] });
        }
        const sub = subjectMap.get(s.subject)!;
        sub.weightedScore += (s.score * multiplier);
        sub.weightedMax += (s.maxScore * multiplier);
        sub.entries.push(s);
    });

    // Calculate global average scaled to defaultMaxScore
    const averageRatio = totalWeightedMax > 0 
        ? (totalWeightedScore / totalWeightedMax) 
        : 0;
    const average = averageRatio * defaultMaxScore;
    
    // Process subject map into sorted array
    const subjectData = Array.from(subjectMap.entries()).map(([name, data]) => {
        const subAvgRatio = data.weightedMax > 0 
            ? (data.weightedScore / data.weightedMax)
            : 0;
        return {
            name,
            average: subAvgRatio * defaultMaxScore,
            entries: data.entries.sort((a, b) => b.timestamp - a.timestamp) // Sort entries by date descending
        };
    }).sort((a, b) => a.name.localeCompare(b.name)); // Sort subjects alphabetically

    // Find best subject based on weighted average
    let bestSubject = 'N/A';
    let maxAvg = -1;
    subjectData.forEach(sub => {
        if(sub.average > maxAvg) {
            maxAvg = sub.average;
            bestSubject = sub.name;
        }
    });

    return { average, total, bestSubject, subjectData };
  }, [filteredScores, customFactors, defaultMaxScore]);

  if (scores.length === 0) return null;

  // Generate semester options
  const semesterOptions = ['all', ...Array.from({ length: semestersPerYear }, (_, i) => i + 1)];

  return (
    <div className="mb-8 space-y-6">
      {/* Semester Selector */}
      <div className="flex items-center gap-3 justify-between flex-wrap">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Thống kê
        </h3>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <select 
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="text-sm p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          >
            <option value="all">Tất cả</option>
            {Array.from({ length: semestersPerYear }, (_, i) => (
              <option key={i + 1} value={i + 1}>Học kỳ {i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-indigo-500 dark:bg-indigo-600 text-white p-3 sm:p-4 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <div className="flex items-center gap-2 opacity-80 mb-1">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs font-medium uppercase">Trung bình</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold flex items-baseline">
                {stats.average.toFixed(rounding)}
                <span className="text-xs opacity-70 ml-0.5 font-normal">/{defaultMaxScore}</span>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs font-medium uppercase">Số lượng</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs font-medium uppercase">Môn học cao nhất</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{stats.bestSubject}</div>
        </div>
      </div>

      {/* Subject Breakdown Tables */}
      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng hợp</h3>
        
        <div className="grid gap-6 md:grid-cols-1"> 
            {stats.subjectData.map((subject) => (
                <div key={subject.name} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base sm:text-lg">{subject.name}</h4>
                        <div className="text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {subject.average.toFixed(rounding)}
                            <span className="text-xs opacity-70 ml-0.5">/{defaultMaxScore}</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm text-left">
                            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-3 sm:px-5 py-2 sm:py-3 font-medium w-1/3">Loại bài kiểm tra</th>
                                    <th className="px-3 sm:px-5 py-2 sm:py-3 font-medium w-1/3">Điểm số</th>
                                    <th className="px-3 sm:px-5 py-2 sm:py-3 font-medium w-1/3 text-right">Ngày</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {subject.entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-3 sm:px-5 py-2 sm:py-3 text-slate-700 dark:text-slate-300">
                                            {entry.examType}
                                        </td>
                                        <td className="px-3 sm:px-5 py-2 sm:py-3 font-medium text-slate-800 dark:text-slate-200">
                                            {entry.score} <span className="text-slate-400 text-xs font-normal">/{entry.maxScore}</span>
                                        </td>
                                        <td className="px-3 sm:px-5 py-2 sm:py-3 text-right text-slate-500 dark:text-slate-500 whitespace-nowrap">
                                            {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};