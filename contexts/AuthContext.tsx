import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { 
  getCurrentUser, 
  onAuthStateChange,
  signIn as supabaseSignIn,
  signUp as supabaseSignUp,
  signOut as supabaseSignOut
} from '../services/supabaseService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    getCurrentUser().then((user) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const subscription = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user } = await supabaseSignIn(email, password);
    setUser(user);
  };

  const signUp = async (email: string, password: string) => {
    const { user } = await supabaseSignUp(email, password);
    setUser(user);
  };

  const signOut = async () => {
    await supabaseSignOut();
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
