import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { Text, Avatar, Surface, IconButton, Divider, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../src/contexts/AuthContext';
import { DESIGNER_COLORS } from '../../../src/constants/colors';
import { SPACING } from '../../../src/constants/theme';
import { router } from 'expo-router';
import { Alert } from 'react-native';

export default function DesignerProfile() {
  const { session, signOut, switchMode } = useAuth();
  const [loading, setLoading] = useState(false);
  const user = session?.user;

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

  const StatItem = ({ value, label }: { value: string | number, label: string }) => (
    <View style={styles.statItem}>
      <Text variant="titleLarge" style={styles.statValue}>{value}</Text>
      <Text variant="bodySmall" style={styles.statLabel}>{label}</Text>
    </View>
  );

  const MenuItem = ({ icon, title, onPress }: { icon: string, title: string, onPress?: () => void }) => (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <MaterialCommunityIcons name={icon as any} size={24} color={DESIGNER_COLORS.text} />
      <Text variant="bodyLarge" style={styles.menuItemText}>{title}</Text>
      <MaterialCommunityIcons name="chevron-right" size={24} color={DESIGNER_COLORS.textSecondary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <Surface style={styles.header}>
          <View style={styles.profileHeader}>
            <Avatar.Text 
              size={80} 
              label={user?.user_metadata?.full_name?.charAt(0) || 'U'} 
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.name}>
                {user?.user_metadata?.full_name || 'Designer'}
              </Text>
              <Text variant="bodyMedium" style={styles.email}>
                {user?.email}
              </Text>
            </View>
          </View>

          <View style={styles.stats}>
            <StatItem value={6} label="My Salons" />
            <StatItem value="203" label="Appointments" />
            <StatItem value="4.9★" label="Rating" />
          </View>
        </Surface>

        <View style={styles.menuSection}>
          <MenuItem icon="account-convert" title="Switch to User Mode" onPress={handleSwitchToUser} />
          <Divider />
          <MenuItem icon="cog" title="Settings" />
          <Divider />
          <MenuItem icon="bell-outline" title="Notifications" />
          <Divider />
          <MenuItem icon="history" title="History" />
          <Divider />
          <MenuItem icon="bookmark-outline" title="Saved Items" />
          <Divider />
          <MenuItem icon="help-circle-outline" title="Help & Support" />
          <Divider />
          <MenuItem icon="logout" title="Sign Out" onPress={signOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGNER_COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: DESIGNER_COLORS.surface,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    backgroundColor: DESIGNER_COLORS.primary,
  },
  profileInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  name: {
    color: DESIGNER_COLORS.text,
    fontWeight: 'bold',
  },
  email: {
    color: DESIGNER_COLORS.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: DESIGNER_COLORS.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    color: DESIGNER_COLORS.textSecondary,
  },
  menuSection: {
    backgroundColor: DESIGNER_COLORS.surface,
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  menuItemText: {
    flex: 1,
    marginLeft: SPACING.md,
    color: DESIGNER_COLORS.text,
  },
}); 