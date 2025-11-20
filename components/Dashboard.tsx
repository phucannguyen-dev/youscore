import React, { useMemo } from 'react';
import { ScoreEntry, CustomFactor } from '../types';
import { TrendingUp, Award, BookOpen } from 'lucide-react';

interface DashboardProps {
  scores: ScoreEntry[];
  isDarkMode: boolean;
  rounding: number;
  customFactors: CustomFactor[];
  defaultMaxScore: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ scores, isDarkMode, rounding, customFactors, defaultMaxScore }) => {
  const stats = useMemo(() => {
    if (scores.length === 0) return { average: 0, total: 0, bestSubject: 'N/A', subjectData: [] };
    
    const total = scores.length;
    
    // Weighted Average Calculation Variables
    let totalWeightedScore = 0;
    let totalWeightedMax = 0;

    // Map for O(1) lookup of factors
    const factorMap = new Map<string, number>(
      customFactors.map(f => [f.name, f.multiplier])
    );

    // Structure to hold per-subject aggregation
    const subjectMap = new Map<string, { weightedScore: number; weightedMax: number; entries: ScoreEntry[] }>();

    scores.forEach(s => {
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
  }, [scores, customFactors, defaultMaxScore]);

  if (scores.length === 0) return null;

  return (
    <div className="mb-8 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-indigo-500 dark:bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <div className="flex items-center gap-2 opacity-80 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Trung bình</span>
            </div>
            <div className="text-2xl font-bold flex items-baseline">
                {stats.average.toFixed(rounding)}
                <span className="text-xs opacity-70 ml-0.5 font-normal">/{defaultMaxScore}</span>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Số lượng</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <Award className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Môn học cao nhất</span>
            </div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{stats.bestSubject}</div>
        </div>
      </div>

      {/* Subject Breakdown Tables */}
      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng hợp</h3>
        
        <div className="grid gap-6 md:grid-cols-1"> 
            {stats.subjectData.map((subject) => (
                <div key={subject.name} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{subject.name}</h4>
                        <div className="text-sm font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {subject.average.toFixed(rounding)}
                            <span className="text-[10px] opacity-70 ml-0.5">/{defaultMaxScore}</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-5 py-3 font-medium w-1/3">Loại bài kiểm tra</th>
                                    <th className="px-5 py-3 font-medium w-1/3">Điểm số</th>
                                    <th className="px-5 py-3 font-medium w-1/3 text-right">Ngày</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {subject.entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                                            {entry.examType}
                                        </td>
                                        <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                                            {entry.score} <span className="text-slate-400 text-xs font-normal">/{entry.maxScore}</span>
                                        </td>
                                        <td className="px-5 py-3 text-right text-slate-500 dark:text-slate-500 whitespace-nowrap">
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