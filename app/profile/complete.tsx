import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, SPACING } from '@/constants/theme';

export default function ProfileComplete() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{ returnTo: string }>();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    age: '',
    gender: 'male' as 'male' | 'female',
    hair_length: 'medium' as 'short' | 'medium' | 'long',
    hair_color: ''
  });

  const handleSubmit = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          age: parseInt(profile.age),
          gender: profile.gender,
          hair_length: profile.hair_length,
          hair_color: profile.hair_color,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) throw error;
      router.push(params.returnTo || '/');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          Complete Your Profile
        </Text>

        <TextInput
          label="Full Name"
          value={profile.full_name}
          onChangeText={text => setProfile(p => ({ ...p, full_name: text }))}
          style={styles.input}
        />

        <TextInput
          label="Phone"
          value={profile.phone}
          onChangeText={text => setProfile(p => ({ ...p, phone: text }))}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <TextInput
          label="Age"
          value={profile.age}
          onChangeText={text => setProfile(p => ({ ...p, age: text }))}
          keyboardType="numeric"
          style={styles.input}
        />

        <Text variant="bodyLarge" style={styles.sectionTitle}>Gender</Text>
        <SegmentedButtons
          value={profile.gender}
          onValueChange={value => setProfile(p => ({ ...p, gender: value as 'male' | 'female' }))}
          buttons={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' }
          ]}
          style={styles.segmented}
        />

        <Text variant="bodyLarge" style={styles.sectionTitle}>Hair Length</Text>
        <SegmentedButtons
          value={profile.hair_length}
          onValueChange={value => setProfile(p => ({ ...p, hair_length: value as 'short' | 'medium' | 'long' }))}
          buttons={[
            { value: 'short', label: 'Short' },
            { value: 'medium', label: 'Medium' },
            { value: 'long', label: 'Long' }
          ]}
          style={styles.segmented}
        />

        <TextInput
          label="Hair Color"
          value={profile.hair_color}
          onChangeText={text => setProfile(p => ({ ...p, hair_color: text }))}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          style={styles.button}
        >
          Save Profile
        </Button>
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
  title: {
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    color: COLORS.textSecondary,
  },
  input: {
    marginBottom: SPACING.md,
  },
  segmented: {
    marginBottom: SPACING.lg,
  },
  button: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
}); 