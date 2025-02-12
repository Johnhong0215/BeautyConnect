import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useMode } from '../src/contexts/ModeContext';

export default function Index() {
  const { session } = useAuth();
  const { mode } = useMode();

  if (!session) {
    return <Redirect href="/auth/sign-in" />;
  }

  return <Redirect href={mode === 'designer' ? "/designer" : "/tabs"} />;
} 