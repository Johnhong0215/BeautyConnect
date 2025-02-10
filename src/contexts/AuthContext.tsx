import { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { createInitialProfile } from '../utils/auth';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMode } from './ModeContext';
import { Alert } from 'react-native';

export interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  switchMode: (mode: 'user' | 'designer') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Add this type for minimal session data
interface MinimalSession {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
  };
}

interface AuthResponse {
  error: Error | null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { switchMode } = useMode();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      try {
        // Get session from storage first
        const storedSession = await AsyncStorage.getItem('userSession');
        if (storedSession) {
          setSession(JSON.parse(storedSession));
        }

        // Then check with Supabase
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          setSession(currentSession);
          await AsyncStorage.setItem('userSession', JSON.stringify(currentSession));
        }
      } catch (error) {
        console.error('Session initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' && newSession) {
        setSession(newSession);
        await AsyncStorage.setItem('userSession', JSON.stringify(newSession));
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        await AsyncStorage.removeItem('userSession');
        router.replace('/auth/sign-in');
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession);
        await AsyncStorage.setItem('userSession', JSON.stringify(newSession));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const handleSwitchMode = async (mode: 'user' | 'designer') => {
    try {
      await switchMode(mode);
      router.replace(mode === 'user' ? '/tabs' : '/designer/tabs');
    } catch (error) {
      console.error('Error switching mode:', error);
      Alert.alert('Error', 'Failed to switch mode');
    }
  };

  const value = {
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    switchMode: handleSwitchMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 