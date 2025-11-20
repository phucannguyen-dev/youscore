import React, { useState } from 'react';
import { ArrowLeft, Download, SlidersHorizontal, Calculator, Calendar, Database, Plus, Trash2, X, Save } from 'lucide-react';
import { AppSettings, CustomFactor } from '../types';

interface SettingsProps {
  onBack: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onExport: () => void;
  onSaveSettings: () => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ onBack, settings, onUpdateSettings, onExport, onSaveSettings }) => {
  const [newFactorName, setNewFactorName] = useState('');
  const [newFactorMultiplier, setNewFactorMultiplier] = useState(1);
  const [isAddingFactor, setIsAddingFactor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveSettings();
    setIsSaving(false);
  };

  const handleAddFactor = () => {
    if (!newFactorName.trim()) return;
    
    const newFactor: CustomFactor = {
      id: crypto.randomUUID(),
      name: newFactorName.trim(),
      multiplier: newFactorMultiplier
    };

    handleChange('customFactors', [...settings.customFactors, newFactor]);
    setNewFactorName('');
    setNewFactorMultiplier(1);
    setIsAddingFactor(false);
  };

  const handleDeleteFactor = (id: string) => {
    handleChange('customFactors', settings.customFactors.filter(f => f.id !== id));
  };

  const handleUpdateFactor = (id: string, field: keyof CustomFactor, value: any) => {
    handleChange(
      'customFactors', 
      settings.customFactors.map(f => f.id === id ? { ...f, [field]: value } : f)
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Quay về"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Cài đặt</h2>
        </div>
        
        {/* Save Settings Button */}
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </button>
      </div>
      
      {/* Language Selection */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Ngôn ngữ / Language
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Chọn ngôn ngữ / Select Language
                </label>
                <select 
                    value={settings.language}
                    onChange={(e) => handleChange('language', e.target.value as 'vi' | 'en')}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                </select>
            </div>
        </div>
      </section>
      
      {/* Display & Sort */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Hiển thị & Sắp xếp
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sắp xếp môn học theo</label>
                <select 
                    value={settings.sortOption}
                    onChange={(e) => handleChange('sortOption', e.target.value as any)}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                    <option value="date_desc">Mới nhất (Theo ngày)</option>
                    <option value="date_asc">Cũ nhất (Theo ngày)</option>
                    <option value="subject_asc">Tên môn học (A-Z)</option>
                    <option value="subject_desc">Tên môn học (Z-A)</option>
                    <option value="score_high">Điểm cao nhất</option>
                    <option value="score_low">Điểm thấp nhất</option>
                </select>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                     <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Hiển thị ngày</span>
                     <span className="text-xs text-slate-500 dark:text-slate-500">Hiển thị ngày trên thẻ điểm</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={settings.showDates} 
                        onChange={(e) => handleChange('showDates', e.target.checked)}
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
            </div>
        </div>
      </section>

      {/* Score Weighting / Factors */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Hệ số điểm (Factors)
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Định nghĩa các loại bài thi và hệ số của chúng. AI sẽ phân loại bài thi của bạn vào các loại này.
            </p>
            
            <div className="space-y-3">
                {settings.customFactors.map((factor) => (
                    <div key={factor.id} className="flex items-center gap-2 group">
                        <div className="flex-1">
                             <input 
                                type="text" 
                                value={factor.name}
                                onChange={(e) => handleUpdateFactor(factor.id, 'name', e.target.value)}
                                className="w-full p-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-slate-200 dark:focus:border-slate-700 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                                placeholder="Tên hệ số"
                             />
                        </div>
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 border border-slate-200 dark:border-slate-700">
                            <span className="text-xs text-slate-400">x</span>
                            <input 
                                type="number" 
                                value={factor.multiplier}
                                onChange={(e) => handleUpdateFactor(factor.id, 'multiplier', parseFloat(e.target.value) || 1)}
                                className="w-12 p-2 text-sm bg-transparent text-center outline-none"
                                min="0.1"
                                step="0.1"
                            />
                        </div>
                        <button 
                            onClick={() => handleDeleteFactor(factor.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Xóa hệ số"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {isAddingFactor ? (
                <div className="flex items-center gap-2 mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
                    <input 
                        type="text" 
                        value={newFactorName}
                        onChange={(e) => setNewFactorName(e.target.value)}
                        placeholder="Tên hệ số (ví dụ: Cuối học kì)"
                        className="flex-1 p-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        autoFocus
                    />
                     <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-md px-2 border border-slate-200 dark:border-slate-700">
                            <span className="text-xs text-slate-400">x</span>
                            <input 
                                type="number" 
                                value={newFactorMultiplier}
                                onChange={(e) => setNewFactorMultiplier(parseFloat(e.target.value) || 1)}
                                className="w-12 p-2 text-sm bg-transparent text-center outline-none"
                                min="0.1"
                                step="0.1"
                            />
                    </div>
                    <button 
                        onClick={handleAddFactor}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                     <button 
                        onClick={() => setIsAddingFactor(false)}
                        className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <button 
                    onClick={() => setIsAddingFactor(true)}
                    className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900/30 rounded-lg transition-all border-dashed"
                >
                    <Plus className="w-4 h-4" /> Thêm hệ số
                </button>
            )}
        </div>
      </section>

      {/* Calculation Defaults */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Cài đặt tính toán
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Làm tròn điểm</label>
                <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map(places => (
                        <button
                            key={places}
                            onClick={() => handleChange('rounding', places as 0 | 1 | 2)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                                settings.rounding === places 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            {places === 0 ? 'Đơn vị' : `${places} số thập phân${places > 1 ? '' : ''}`}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Điểm tối đa</label>
                <input 
                    type="number" 
                    value={settings.defaultMaxScore}
                    onChange={(e) => handleChange('defaultMaxScore', parseInt(e.target.value) || 10)}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    min="1"
                />
                <p className="text-xs text-slate-500 mt-1">Được sử dụng khi không cho biết tối đa (ví dụ: "Đạt 8 môn Toán")</p>
            </div>
        </div>
      </section>

      {/* Metadata */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Năm học
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Số lượng học kỳ</label>
                <select 
                    value={settings.semestersPerYear}
                    onChange={(e) => handleChange('semestersPerYear', parseInt(e.target.value))}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                    <option value="1">1 (Mỗi năm)</option>
                    <option value="2">2 (Học kỳ chuẩn)</option>
                    <option value="3">3 (3 học kỳ)</option>
                    <option value="4">4 (4 học kỳ)</option>
                </select>
            </div>
        </div>
      </section>

      {/* Data Actions */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4" /> Quản lý dữ liệu
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
             <button 
                onClick={onExport}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white py-3 rounded-lg transition-colors font-medium"
             >
                <Download className="w-5 h-5" />
                Xuất báo cáo
             </button>
             <p className="text-xs text-center text-slate-500 mt-2">
                Tạo báo cáo in được của điểm hiện tại của bạn.
             </p>
        </div>
      </section>

    </div>
  );
};