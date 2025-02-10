import { StyleSheet, View, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Text, Avatar, List, Surface, Button, Modal, Portal, IconButton, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../src/services/supabase';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { useMode } from '../../src/contexts/ModeContext';

export default function Profile() {
  const { signOut, session } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [guestsModalVisible, setGuestsModalVisible] = useState(false);
  const [guests, setGuests] = useState<any[]>([]);
  const translateY = useSharedValue(0);
  const [isLoading, setIsLoading] = useState(false);
  const { mode, switchMode } = useMode();
  const [isDesignerRole, setIsDesignerRole] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    checkDesignerRole();
  }, []);

  const fetchProfile = async () => {
    if (!session?.user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchGuests = async () => {
    if (!session?.user) {
      console.log('No session user');
      return;
    }
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('created_by', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching guests:', error);
        throw error;
      }

      console.log('Fetched guests:', data);
      setGuests(data || []);
    } catch (error) {
      console.error('Error in fetchGuests:', error);
      Alert.alert(
        'Error',
        'Failed to load guests. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const checkDesignerRole = async () => {
    if (!session?.user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (error) throw error;
      setIsDesignerRole(data.role === 'designer');
    } catch (error) {
      console.error('Error checking designer status:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/sign-in');
    } catch (error) {
      console.error(error);
    }
  };

  const showGuestsModal = async () => {
    try {
      setIsLoading(true);
      await fetchGuests();
      setGuestsModalVisible(true);
      translateY.value = withSpring(0);
    } catch (error) {
      console.error('Error showing guests modal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hideGuestsModal = () => {
    setIsLoading(true);
    translateY.value = withSpring(1000, {}, () => {
      runOnJS(setGuestsModalVisible)(false);
      runOnJS(setIsLoading)(false);
    });
  };

  const handleGuestEdit = (guest: any) => {
    setIsLoading(true);
    hideGuestsModal();
    
    setTimeout(() => {
      router.push({
        pathname: '/booking/guest-form',
        params: { 
          guestId: guest.id,
          mode: 'edit',
          fullName: guest.full_name,
          age: guest.age.toString(),
          gender: guest.gender,
          hairLength: guest.hair_length,
          hairColor: guest.hair_color,
          notes: guest.notes || ''
        }
      });
    }, 300);

    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: (event) => {
      if (event.velocityY > 500 || event.translationY > 100) {
        translateY.value = withSpring(1000);
        runOnJS(hideGuestsModal)();
      } else {
        translateY.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const handleDeleteGuest = async (guestId: string) => {
    Alert.alert(
      "Delete Guest",
      "Are you sure you want to delete this guest? This will also delete all their appointments.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              if (!session?.user) {
                throw new Error('No authenticated user');
              }

              // First delete all appointments for this guest
              const { error: appointmentsError } = await supabase
                .from('appointments')
                .delete()
                .match({ guest_id: guestId });

              if (appointmentsError) throw appointmentsError;

              // Then delete the guest
              const { error: guestError } = await supabase
                .from('guests')
                .delete()
                .match({ 
                  id: guestId,
                  created_by: session.user.id 
                });

              if (guestError) throw guestError;

              setIsLoading(false);
              setGuests(currentGuests => 
                currentGuests.filter(guest => guest.id !== guestId)
              );

              Alert.alert(
                "Success",
                "Guest and their appointments have been deleted successfully"
              );
            } catch (error) {
              setIsLoading(false);
              console.error('Error deleting guest:', error);
              Alert.alert(
                "Error",
                "Failed to delete guest. Please try again."
              );
            }
          }
        }
      ]
    );
  };

  const handleRoleToggle = async () => {
    if (!session?.user) return;
    
    try {
      setLoading(true);
      
      // Check if user has any salons before switching to designer
      const { data: salons, error: salonError } = await supabase
        .from('hair_salon')
        .select('id')
        .eq('owner_id', session.user.id);
        
      if (salonError) throw salonError;
      
      if (!salons || salons.length === 0) {
        router.push('/salon/setup');
        return;
      }
      
      await switchMode('designer');
      router.replace('/designer');
      
    } catch (error) {
      console.error('Error switching mode:', error);
      Alert.alert('Error', 'Failed to switch mode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        {/* Profile Header */}
        <Surface style={styles.header} elevation={1}>
          <View style={styles.profileInfo}>
            <Avatar.Icon size={80} icon="account" style={styles.avatar} />
            <View style={styles.nameContainer}>
              <Text variant="headlineSmall" style={styles.name}>
                {profile?.full_name || 'User'}
              </Text>
              <Text variant="bodyMedium" style={styles.email}>
                {profile?.email || session?.user?.email}
              </Text>
            </View>
          </View>

          {/* Stats Section */}
          <Surface style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="calendar-check" size={24} color={COLORS.primary} />
              <Text variant="titleMedium" style={styles.statNumber}>5</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Appointments</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="star" size={24} color={COLORS.primary} />
              <Text variant="titleMedium" style={styles.statNumber}>4.8</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock-outline" size={24} color={COLORS.primary} />
              <Text variant="titleMedium" style={styles.statNumber}>180</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Minutes saved</Text>
            </View>
          </Surface>
        </Surface>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <List.Item
            title="Notifications"
            left={props => <List.Icon {...props} icon="bell-outline" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title="Payment Methods"
            left={props => <List.Icon {...props} icon="credit-card-outline" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title="Guests"
            left={props => <List.Icon {...props} icon="account-group" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/guests')}
          />
          <List.Item
            title="Preferences"
            left={props => <List.Icon {...props} icon="cog-outline" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title="Help & Support"
            left={props => <List.Icon {...props} icon="help-circle-outline" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title="About"
            left={props => <List.Icon {...props} icon="information-outline" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
          <List.Item
            title="Past Appointments"
            left={props => <List.Icon {...props} icon="history" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/past-appointments')}
          />
          {isDesignerRole && (
            <List.Item
              title="Switch to Designer Mode"
              left={props => <List.Icon {...props} icon="account-tie" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleRoleToggle}
              disabled={loading}
            />
          )}
        </View>

        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.signOutButton}
          textColor={COLORS.error}
        >
          Sign Out
        </Button>

        <Portal>
          <Modal
            visible={guestsModalVisible}
            onDismiss={hideGuestsModal}
            contentContainerStyle={styles.modalContainer}
          >
            <PanGestureHandler onGestureEvent={gestureHandler}>
              <Animated.View style={[styles.modalContent, animatedStyle]}>
                <View style={styles.modalHandle} />
                <View style={styles.modalHeader}>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={hideGuestsModal}
                  />
                  <Text style={styles.modalTitle}>Guests</Text>
                  <IconButton
                    icon="plus"
                    size={24}
                    onPress={() => {
                      hideGuestsModal();
                      router.push('/booking/guest-form');
                    }}
                  />
                </View>

                <ScrollView 
                  style={styles.guestsList}
                  contentContainerStyle={styles.guestsListContent}
                  showsVerticalScrollIndicator={false}
                >
                  {guests.map((guest) => (
                    <Pressable 
                      key={guest.id} 
                      style={({ pressed }) => [
                        styles.guestCard,
                        pressed && styles.guestCardPressed
                      ]}
                      onPress={() => handleGuestEdit(guest)}
                    >
                      <View style={styles.guestCardContent}>
                        <Avatar.Icon 
                          size={44} 
                          icon="account" 
                          style={[
                            styles.guestAvatar,
                            { 
                              backgroundColor: guest.gender === 'female' 
                                ? 'rgb(255, 242, 242)' 
                                : 'rgb(242, 246, 255)' 
                            }
                          ]} 
                          color={guest.gender === 'female' ? '#FF6B6B' : '#4A90E2'}
                        />
                        <View style={styles.guestInfo}>
                          <Text style={styles.guestName}>{guest.full_name}</Text>
                          <View style={styles.guestDetailsContainer}>
                            <View style={styles.detailItem}>
                              <MaterialCommunityIcons name="calendar" size={14} color="#666" />
                              <Text style={styles.detailText}>{guest.age} years</Text>
                            </View>
                            <View style={styles.detailItem}>
                              <MaterialCommunityIcons 
                                name={guest.gender === 'female' ? 'gender-female' : 'gender-male'} 
                                size={14} 
                                color="#666" 
                              />
                              <Text style={styles.detailText}>{guest.gender}</Text>
                            </View>
                            <View style={styles.detailItem}>
                              <MaterialCommunityIcons name="content-cut" size={14} color="#666" />
                              <Text style={styles.detailText}>{guest.hair_length} hair</Text>
                            </View>
                          </View>
                        </View>
                        <IconButton 
                          icon="chevron-right" 
                          size={24} 
                          iconColor="#CCC"
                        />
                      </View>
                      <View style={styles.guestCardActions}>
                        <Button 
                          mode="outlined" 
                          textColor={COLORS.error}
                          style={styles.deleteButton}
                          onPress={() => handleDeleteGuest(guest.id)}
                        >
                          Delete Guest
                        </Button>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </Animated.View>
            </PanGestureHandler>
          </Modal>
        </Portal>
      </ScrollView>

      {/* Separate Portal for loading overlay */}
      <Portal>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator 
              size="large" 
              color={COLORS.primary}
              animating={true}
            />
          </View>
        )}
      </Portal>
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
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    backgroundColor: COLORS.primary,
  },
  nameContainer: {
    marginLeft: SPACING.lg,
  },
  name: {
    fontWeight: '600',
    color: COLORS.text,
  },
  email: {
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  statLabel: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  menuSection: {
    backgroundColor: COLORS.surface,
    marginTop: SPACING.lg,
  },
  signOutButton: {
    margin: SPACING.lg,
    borderColor: COLORS.error,
  },
  modalContainer: {
    margin: 0,
    flex: 1,
    justifyContent: 'flex-end',
    height: '95%',
    marginTop: '5%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  headerIcon: {
    margin: 0,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
  },
  guestsList: {
    flex: 1,
  },
  guestsListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  guestCard: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  guestCardPressed: {
    backgroundColor: '#f8f8f8',
    transform: [{ scale: 0.98 }],
  },
  guestCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  guestAvatar: {
    marginRight: 16,
    borderRadius: 22,
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  guestDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 2,
  },
  guestCardActions: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  deleteButton: {
    borderColor: COLORS.error,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    elevation: 9999,
    zIndex: 9999,
  },
}); 