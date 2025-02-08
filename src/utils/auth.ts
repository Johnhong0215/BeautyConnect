import { supabase } from '../services/supabase';

export const createInitialProfile = async (userId: string, email: string) => {
  try {
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      email: email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in createInitialProfile:', error);
    throw error;
  }
}; 