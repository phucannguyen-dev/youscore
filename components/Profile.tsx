import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, UserCircle, Lock, Trash2, Calendar } from 'lucide-react';
import { getUserProfile, upsertUserProfile, updatePassword, deleteAccount, UserProfile } from '../lib/supabase';
import { AppSettings } from '../types';

interface ProfileProps {
  onBack: () => void;
  onAccountDeleted: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onSaveSettings: () => Promise<void>;
}

const MONTHS = [
  { value: 1, label: 'Tháng 1' },
  { value: 2, label: 'Tháng 2' },
  { value: 3, label: 'Tháng 3' },
  { value: 4, label: 'Tháng 4' },
  { value: 5, label: 'Tháng 5' },
  { value: 6, label: 'Tháng 6' },
  { value: 7, label: 'Tháng 7' },
  { value: 8, label: 'Tháng 8' },
  { value: 9, label: 'Tháng 9' },
  { value: 10, label: 'Tháng 10' },
  { value: 11, label: 'Tháng 11' },
  { value: 12, label: 'Tháng 12' },
];

export const Profile: React.FC<ProfileProps> = ({ 
  onBack, 
  onAccountDeleted,
  settings,
  onUpdateSettings,
  onSaveSettings
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userProfile = await getUserProfile();
    if (userProfile) {
      setProfile(userProfile);
      setFullName(userProfile.full_name || '');
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // Update profile
      const updatedProfile = await upsertUserProfile({
        full_name: fullName.trim() || null,
      });

      if (updatedProfile) {
        setProfile(updatedProfile);
        setMessage({ text: 'Hồ sơ đã được cập nhật thành công!', type: 'success' });
      } else {
        setMessage({ text: 'Không thể cập nhật hồ sơ', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Đã xảy ra lỗi khi cập nhật hồ sơ', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setMessage(null);

    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setMessage({ text: 'Vui lòng nhập mật khẩu mới và xác nhận', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: 'Mật khẩu phải có ít nhất 6 ký tự', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Mật khẩu không khớp', type: 'error' });
      return;
    }

    setIsSaving(true);

    const result = await updatePassword(newPassword);

    if (result.success) {
      setMessage({ text: 'Mật khẩu đã được thay đổi thành công!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setMessage({ text: result.error || 'Không thể thay đổi mật khẩu', type: 'error' });
    }

    setIsSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'XÓA TÀI KHOẢN') {
      setMessage({ text: 'Vui lòng nhập chính xác "XÓA TÀI KHOẢN" để xác nhận', type: 'error' });
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    const result = await deleteAccount();

    if (result.success) {
      // Call the callback to handle post-deletion cleanup
      onAccountDeleted();
    } else {
      setMessage({ text: result.error || 'Không thể xóa tài khoản', type: 'error' });
      setIsDeleting(false);
    }
  };

  const handleSemesterMonthChange = async (field: 'semesterStartMonth' | 'semesterEndMonth', value: number) => {
    const newSettings = { ...settings, [field]: value };
    onUpdateSettings(newSettings);
    
    // Auto-save to cloud
    await onSaveSettings();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          aria-label="Quay về"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Hồ sơ cá nhân</h2>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* User Information */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <UserCircle className="w-4 h-4" /> Thông tin cá nhân
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email
            </label>
            <input 
              type="email"
              value={profile?.user_id || 'Đang tải...'}
              disabled
              className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">Email không thể thay đổi</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tên hiển thị
            </label>
            <input 
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập tên của bạn"
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2.5 rounded-lg transition-colors font-medium shadow-sm"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </div>
      </section>

      {/* Change Password */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4" /> Thay đổi mật khẩu
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Mật khẩu mới
            </label>
            <input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Xác nhận mật khẩu mới
            </label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <button 
            onClick={handleChangePassword}
            disabled={isSaving || !newPassword || !confirmPassword}
            className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600 dark:disabled:bg-slate-800 text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
          >
            <Lock className="w-4 h-4" />
            Thay đổi mật khẩu
          </button>
        </div>
      </section>

      {/* Semester Months */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Cài đặt học kỳ
        </h3>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Đặt tháng bắt đầu và kết thúc học kỳ của bạn
          </p>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tháng bắt đầu học kỳ
            </label>
            <select 
              value={settings.semesterStartMonth || 9}
              onChange={(e) => handleSemesterMonthChange('semesterStartMonth', parseInt(e.target.value))}
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              {MONTHS.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tháng kết thúc học kỳ
            </label>
            <select 
              value={settings.semesterEndMonth || 6}
              onChange={(e) => handleSemesterMonthChange('semesterEndMonth', parseInt(e.target.value))}
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              {MONTHS.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-500">
            Cài đặt này sẽ được lưu tự động
          </p>
        </div>
      </section>

      {/* Delete Account */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Vùng nguy hiểm
        </h3>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 shadow-sm border border-red-200 dark:border-red-800 space-y-4">
          {!showDeleteConfirm ? (
            <>
              <p className="text-sm text-red-700 dark:text-red-300">
                Xóa tài khoản của bạn và tất cả dữ liệu liên quan. Hành động này không thể hoàn tác.
              </p>
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Xóa tài khoản
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                Bạn có chắc chắn muốn xóa tài khoản của mình không?
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Nhập <strong>XÓA TÀI KHOẢN</strong> để xác nhận
              </p>
              <input 
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="XÓA TÀI KHOẢN"
                className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-800 border-2 border-red-300 dark:border-red-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== 'XÓA TÀI KHOẢN'}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 dark:disabled:bg-red-900/50 text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
