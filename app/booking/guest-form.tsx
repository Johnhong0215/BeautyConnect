import { useState, useRef } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';

export default function GuestForm() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{
    mode?: 'edit';
    guestId?: string;
    fullName?: string;
    age?: string;
    gender?: string;
    hairLength?: string;
    hairColor?: string;
    notes?: string;
  }>();

  if (!session) {
    router.replace('/auth');
    return null;
  }

  const [loading, setLoading] = useState(false);

  // Build the initial guest object from the URL parameters.
  const initialGuest = {
    full_name: params.fullName || '',
    age: params.age ? parseInt(params.age) : undefined,
    gender: params.gender || 'male',
    hair_length: params.hairLength || 'medium',
    hair_color: params.hairColor || '',
    notes: params.notes || '',
  };

  // Save the initial guest values in a ref to compare later.
  const initialGuestRef = useRef(initialGuest);

  // State to hold the current guest form values.
  const [guest, setGuest] = useState(initialGuest);

  const handleChange = (field: string, value: string | number) => {
    setGuest((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!session?.user) return;
    setLoading(true);

    try {
      if (params.mode === 'edit' && params.guestId) {
        // Ensure all required fields are included
        const updatedGuest = {
          full_name: guest.full_name,
          age: guest.age,
          gender: guest.gender,
          hair_length: guest.hair_length,
          hair_color: guest.hair_color,
          notes: guest.notes,
          updated_at: new Date().toISOString()
        };

        console.log('Updating guest:', updatedGuest);

        const { error } = await supabase
          .from('guests')
          .update(updatedGuest)
          .eq('id', params.guestId)
          .eq('created_by', session.user.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }

        Alert.alert('Success', 'Guest updated successfully');
        router.back();
      } else {
        // Create new guest
        const { error } = await supabase
          .from('guests')
          .insert({
            full_name: guest.full_name,
            age: guest.age,
            gender: guest.gender,
            hair_length: guest.hair_length,
            hair_color: guest.hair_color,
            notes: guest.notes,
            created_by: session.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        Alert.alert('Success', 'Guest added successfully');
        router.back();
      }
    } catch (error) {
      console.error('Error saving guest:', error);
      Alert.alert('Error', 'Failed to save guest');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!params.guestId) return;

    Alert.alert(
      'Delete Guest',
      'This will also cancel all appointments for this guest. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // First update all linked appointments to 'cancelled'
              const { error: appointmentError } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('guest_id', params.guestId);

              if (appointmentError) throw appointmentError;

              // Then delete the guest
              const { error: deleteError } = await supabase
                .from('guests')
                .delete()
                .eq('id', params.guestId)
                .eq('created_by', session.user.id);

              if (deleteError) throw deleteError;

              router.back();
            } catch (error) {
              console.error('Error deleting guest:', error);
              Alert.alert('Error', 'Failed to delete guest');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <Text variant="headlineSmall" style={styles.title}>
          Guest Information
        </Text>

        <TextInput
          label="Full Name"
          value={guest.full_name}
          onChangeText={(value) => handleChange('full_name', value)}
          style={styles.input}
        />

        <TextInput
          label="Age"
          value={guest.age?.toString()}
          onChangeText={(value) => handleChange('age', parseInt(value) || 0)}
          keyboardType="numeric"
          style={styles.input}
        />

        <Text variant="bodyMedium" style={styles.label}>
          Gender
        </Text>
        <SegmentedButtons
          value={guest.gender}
          onValueChange={(value) => handleChange('gender', value)}
          buttons={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ]}
          style={styles.segmented}
        />

        <Text variant="bodyMedium" style={styles.label}>
          Hair Length
        </Text>
        <SegmentedButtons
          value={guest.hair_length}
          onValueChange={(value) => handleChange('hair_length', value)}
          buttons={[
            { value: 'short', label: 'Short' },
            { value: 'medium', label: 'Medium' },
            { value: 'long', label: 'Long' },
          ]}
          style={styles.segmented}
        />

        <TextInput
          label="Hair Color"
          value={guest.hair_color}
          onChangeText={(value) => handleChange('hair_color', value)}
          style={styles.input}
        />

        <TextInput
          label="Additional Notes"
          value={guest.notes}
          onChangeText={(value) => handleChange('notes', value)}
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          style={styles.button}
          disabled={!guest.full_name || guest.age === undefined}
        >
          Save
        </Button>

        {params.mode === 'edit' && (
          <Button
            mode="outlined"
            onPress={handleDelete}
            loading={loading}
            style={[styles.button, styles.deleteButton]}
            textColor={COLORS.error}
          >
            Delete Guest
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  title: {
    textAlign: 'center',
    marginVertical: SPACING.xl,
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '600',
  },
  input: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  label: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    color: COLORS.textSecondary,
  },
  segmented: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  button: {
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
  },
  deleteButton: {
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    borderColor: COLORS.error,
  },
});
