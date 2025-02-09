import { supabase } from '../services/supabase';

export const isProfileComplete = (profile: any) => {
  return !!(
    profile?.full_name &&
    profile?.gender &&
    profile?.phone &&
    profile?.age
  );
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data;
}; 