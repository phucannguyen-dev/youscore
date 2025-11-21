import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { Language } from '../types';
import { useTranslation } from '../lib/translations';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center px-4 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl shadow-lg">
              <LogIn className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            {isSignUp ? t.signUp : t.signIn}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignUp ? t.createAccountToSave : t.signInToAccess}
          </p>
        </div>

        {/* Auth Form */}
        <Card>
          <CardHeader className="space-y-1">
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
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                </div>
                {isSignUp && (
                  <p className="text-xs text-muted-foreground">
                    {t.passwordMinLength}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !email.trim() || !password.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isSignUp ? <UserPlus className="w-5 h-5 mr-2" /> : <LogIn className="w-5 h-5 mr-2" />}
                    {isSignUp ? t.signUp : t.signIn}
                  </>
                )}
              </Button>
            </form>

            {/* Toggle Sign Up/Sign In */}
            <div className="mt-6 text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setEmail('');
                  setPassword('');
                  setLocalMessage(null);
                }}
                disabled={isLoading}
                className="text-sm"
              >
                {isSignUp ? t.alreadyHaveAccount : t.dontHaveAccount}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-xs text-muted-foreground">
          {t.dataSecure}
        </p>
      </div>
    </div>
  );
}
