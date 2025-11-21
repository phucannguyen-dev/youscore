import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { Language } from '../types';
import { useTranslation } from '../lib/translations';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface AuthProps {
  onSignIn: (email: string, password: string, language: Language) => Promise<void>;
  onSignUp: (email: string, password: string, language: Language) => Promise<void>;
  message: { text: string; type: 'error' | 'success' } | null;
  isLoading: boolean;
  initialLanguage?: Language;
}

export function Auth({ onSignIn, onSignUp, message, isLoading, initialLanguage = 'vi' }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [localMessage, setLocalMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const t = useTranslation(language);

  // Use parent message or local message
  const displayMessage = message || localMessage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    if (isSignUp) {
      await onSignUp(email, password, language);
    } else {
      await onSignIn(email, password, language);
    }
  };

  return (
    <div className="min-h-screen bg-background flex transition-colors duration-300">
      {/* Left Panel - Testimonial Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 dark:bg-slate-950 relative flex-col justify-end p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
        <div className="relative z-10 text-white">
          <blockquote className="space-y-2">
            <p className="text-lg md:text-xl font-medium leading-relaxed">
              "Web hay, phù hợp để ghi lại điểm số, quá tuyệt vời :D"
            </p>
            <footer className="text-sm text-slate-400">
              - Nhân
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Panel - Form Section */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:p-8">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">YouScore</h1>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setEmail('');
              setPassword('');
              setLocalMessage(null);
            }}
            disabled={isLoading}
            className="text-sm"
          >
            {isSignUp ? (
              <>Đăng nhập / <span className="text-muted-foreground">Login</span></>
            ) : (
              <>Đăng ký / <span className="text-muted-foreground">Sign up</span></>
            )}
          </Button>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center px-6 md:px-8 py-12">
          <div className="w-full max-w-sm space-y-6">
            {/* Form Title */}
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                {isSignUp ? (
                  <>Tạo tài khoản / <span className="text-muted-foreground">Create an account</span></>
                ) : (
                  <>Đăng nhập / <span className="text-muted-foreground">Sign in</span></>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isSignUp ? (
                  <>Nhập email của bạn để tạo tài khoản / <span className="block sm:inline">Enter your email below to create your account</span></>
                ) : (
                  <>Nhập email và mật khẩu để đăng nhập / <span className="block sm:inline">Enter your email and password to sign in</span></>
                )}
              </p>
            </div>

            {/* Messages */}
            {displayMessage && (
              <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                displayMessage.type === 'error' 
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                  : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
              }`}>
                {displayMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{displayMessage.text}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={isLoading}
                  required
                  className="h-10"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mật khẩu / <span className="text-muted-foreground">Password</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                  minLength={6}
                  className="h-10"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !email.trim() || !password.trim()}
                className="w-full h-11"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isSignUp ? (
                  <>Đăng ký bằng email / Sign up with Email</>
                ) : (
                  <>Đăng nhập bằng email / Sign in with Email</>
                )}
              </Button>
            </form>

            {/* Footer Note */}
            <p className="text-center text-xs text-muted-foreground">
              Dữ liệu của bạn được bảo mật và lưu trữ an toàn /<br className="sm:hidden" /> Your data is secure and stored safely
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
