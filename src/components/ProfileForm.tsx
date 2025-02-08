import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Profile } from '../types/database';

interface ProfileFormProps {
  onComplete: () => void;
}

export function ProfileForm({ onComplete }: ProfileFormProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Partial<Profile>>({
    full_name: '',
    phone: '',
    gender: 'male',
    age: undefined,
    hair_length: 'medium',
    hair_color: '',
    notes: '',
  });

  const handleSubmit = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          email: session.user.email,
          ...profile,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>Complete Your Profile</Text>
      
      <TextInput
        label="Full Name"
        value={profile.full_name}
        onChangeText={(text) => setProfile(p => ({ ...p, full_name: text }))}
        style={styles.input}
      />

      <TextInput
        label="Phone"
        value={profile.phone}
        onChangeText={(text) => setProfile(p => ({ ...p, phone: text }))}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <Text variant="bodyMedium" style={styles.label}>Gender</Text>
      <SegmentedButtons
        value={profile.gender || 'male'}
        onValueChange={(value) => setProfile(p => ({ ...p, gender: value as Profile['gender'] }))}
        buttons={[
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'other', label: 'Other' },
        ]}
        style={styles.segmented}
      />

      <TextInput
        label="Age"
        value={profile.age?.toString() || ''}
        onChangeText={(text) => setProfile(p => ({ ...p, age: parseInt(text) || undefined }))}
        keyboardType="number-pad"
        style={styles.input}
      />

      <Text variant="bodyMedium" style={styles.label}>Hair Length</Text>
      <SegmentedButtons
        value={profile.hair_length || 'medium'}
        onValueChange={(value: string) => setProfile(p => ({ ...p, hair_length: value as 'short' | 'medium' | 'long' }))}
        buttons={[
          { value: 'short', label: 'Short' },
          { value: 'medium', label: 'Medium' },
          { value: 'long', label: 'Long' },
        ]}
        style={styles.segmented}
      />

      <TextInput
        label="Hair Color"
        value={profile.hair_color}
        onChangeText={(text) => setProfile(p => ({ ...p, hair_color: text }))}
        style={styles.input}
      />

      <TextInput
        label="Additional Notes"
        value={profile.notes}
        onChangeText={(text) => setProfile(p => ({ ...p, notes: text }))}
        multiline
        numberOfLines={3}
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        style={styles.button}
        disabled={!profile.full_name || !profile.phone}
      >
        Save Profile
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  segmented: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
}); 