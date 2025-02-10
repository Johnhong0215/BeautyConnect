import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, SPACING } from '@/constants/theme';
import { Gender } from '@/types/database';

export default function AddGuest() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [guest, setGuest] = useState({
    full_name: '',
    gender: 'male' as Gender,
    age: '',
    hair_length: 'medium' as 'short' | 'medium' | 'long',
    hair_color: '',
    notes: ''
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* ... other inputs ... */}
        
        <Text variant="bodyLarge" style={styles.label}>Gender</Text>
        <SegmentedButtons
          value={guest.gender}
          onValueChange={value => setGuest(g => ({ ...g, gender: value as Gender }))}
          buttons={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' }
          ]}
          style={styles.segmented}
        />
        
        {/* ... rest of the form ... */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  label: {
    marginBottom: SPACING.sm,
    color: COLORS.text,
  },
  segmented: {
    marginBottom: SPACING.md,
  },
  // ... other styles
}); 