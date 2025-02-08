import { useState, useEffect } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Text, Button, Switch, Surface, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/contexts/AuthContext';
import { supabase } from '../../../src/services/supabase';
import { COLORS, SPACING } from '../../../src/constants/theme';
import { router } from 'expo-router';
import { useMode } from '../../../src/contexts/ModeContext';

export default function DesignerProfile() {
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const { switchMode } = useMode();

  const handleSwitchToUser = async () => {
    try {
      setLoading(true);
      await switchMode('user');
      router.replace('/tabs');
    } catch (error) {
      console.error('Error switching to user mode:', error);
      Alert.alert('Error', 'Failed to switch mode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Surface style={styles.header}>
        <Text variant="headlineMedium">Profile</Text>
        <Chip mode="flat" style={styles.modeChip}>Designer</Chip>
      </Surface>

      <View style={styles.content}>
        <Button
          mode="outlined"
          onPress={handleSwitchToUser}
          loading={loading}
          style={styles.button}
        >
          Switch to User Mode
        </Button>

        <Button 
          mode="outlined" 
          onPress={signOut}
          style={styles.button}
        >
          Sign Out
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    padding: SPACING.lg,
  },
  button: {
    marginBottom: SPACING.md,
  },
  modeChip: {
    backgroundColor: COLORS.primary,
  },
}); 