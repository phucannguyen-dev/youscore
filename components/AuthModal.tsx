import React, { useState } from 'react';
import { X, Mail, Lock, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSignIn, onSignUp }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await onSignIn(email, password);
      } else {
        await onSignUp(email, password);
      }
      onClose();
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {mode === 'signin' ? 'Đăng nhập' : 'Đăng ký'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {mode === 'signin' 
              ? 'Đăng nhập để đồng bộ điểm của bạn' 
              : 'Tạo tài khoản để lưu trữ điểm của bạn'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 text-slate-900 dark:text-white placeholder:text-slate-400"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 text-slate-900 dark:text-white placeholder:text-slate-400"
                required
                minLength={6}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              mode === 'signin' ? 'Đăng nhập' : 'Đăng ký'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            disabled={loading}
          >
            {mode === 'signin' 
              ? 'Chưa có tài khoản? Đăng ký' 
              : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
};
