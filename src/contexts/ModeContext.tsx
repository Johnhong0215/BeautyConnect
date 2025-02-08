import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { supabase } from '../services/supabase';

type Mode = 'user' | 'designer';

interface ModeContextType {
  currentMode: Mode;
  switchMode: (mode: Mode) => Promise<void>;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [currentMode, setCurrentMode] = useState<Mode>('user');
  const router = useRouter();

  useEffect(() => {
    // Load saved mode on startup
    SecureStore.getItemAsync('appMode').then(savedMode => {
      if (savedMode === 'designer') {
        setCurrentMode('designer');
        router.replace('/designer');
      }
    });
  }, []);

  const switchMode = async (mode: Mode) => {
    await SecureStore.setItemAsync('appMode', mode);
    setCurrentMode(mode);
  };

  // Add cleanup on signout
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        await SecureStore.deleteItemAsync('appMode');
        setCurrentMode('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ModeContext.Provider value={{ currentMode, switchMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export const useMode = () => {
  const context = useContext(ModeContext);
  if (!context) throw new Error('useMode must be used within ModeProvider');
  return context;
}; 