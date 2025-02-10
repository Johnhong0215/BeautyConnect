import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { supabase } from '../services/supabase';

type Mode = 'user' | 'designer';

interface ModeContextType {
  mode: Mode;
  switchMode: (newMode: Mode) => Promise<void>;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('user');
  const router = useRouter();

  useEffect(() => {
    // Load saved mode on startup
    SecureStore.getItemAsync('appMode').then(savedMode => {
      if (savedMode === 'designer') {
        setMode('designer');
        router.replace('/designer');
      }
    });
  }, []);

  const switchMode = async (newMode: Mode) => {
    setMode(newMode);
  };

  // Add cleanup on signout
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        await SecureStore.deleteItemAsync('appMode');
        setMode('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ModeContext.Provider value={{ mode, switchMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within ModeProvider');
  }
  return context;
} 