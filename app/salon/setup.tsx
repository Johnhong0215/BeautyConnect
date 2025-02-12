import { useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, Alert, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { Text, TextInput, Button, Surface, Switch, ProgressBar, SegmentedButtons, Card, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/services/supabase';
import { COLORS, SPACING, DESIGNER_COLORS } from '../../src/constants/theme';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import TimeSlider from '../../src/components/TimeSlider';

type Step = 'salon' | 'hours' | 'services';

interface Service {
  name: string;
  description: string;
  duration_male: number;
  duration_female: number;
  price_male: number;
  price_female: number;
  type: 'hair' | 'nail';
}

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface SalonSetupProps {
  mode?: 'setup' | 'add';
  returnTo?: string;
  theme?: 'default' | 'designer';
}

export default function SalonSetup({ 
  mode = 'setup', 
  returnTo = '/tabs',
  theme = 'default' 
}: SalonSetupProps) {
  const { session } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('salon');
  const [loading, setLoading] = useState(false);
  
  const [salonDetails, setSalonDetails] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  });

  const [businessHours, setBusinessHours] = useState([
    { day_of_week: 0, open_time: '09:00', close_time: '17:00', is_closed: true },
    { day_of_week: 1, open_time: '09:00', close_time: '17:00', is_closed: false },
    { day_of_week: 2, open_time: '09:00', close_time: '17:00', is_closed: false },
    { day_of_week: 3, open_time: '09:00', close_time: '17:00', is_closed: false },
    { day_of_week: 4, open_time: '09:00', close_time: '17:00', is_closed: false },
    { day_of_week: 5, open_time: '09:00', close_time: '17:00', is_closed: false },
    { day_of_week: 6, open_time: '09:00', close_time: '17:00', is_closed: true }
  ]);

  const [services, setServices] = useState<Service[]>([{
    name: '',
    description: '',
    duration_male: 30,
    duration_female: 30,
    price_male: 0,
    price_female: 0,
    type: 'hair'
  }]);

  const [location, setLocation] = useState<Location | null>(null);

  const scrollViewRef = useRef<ScrollView | null>(null);

  const [progressAnim] = useState(new Animated.Value(0));

  const colors = theme === 'designer' ? DESIGNER_COLORS : COLORS;

  const [showTimePicker, setShowTimePicker] = useState<{
    show: boolean;
    dayIndex: number;
    isOpenTime: boolean;
    time: Date;
  }>({ 
    show: false, 
    dayIndex: 0, 
    isOpenTime: true,
    time: new Date()
  });

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || showTimePicker.time;
    
    // Always hide picker for Android
    if (Platform.OS === 'android') {
      setShowTimePicker(prev => ({ ...prev, show: false }));
    }

    if (selectedDate) {
      const timeString = format(currentDate, 'HH:mm');
      const newHours = [...businessHours];
      if (showTimePicker.isOpenTime) {
        newHours[showTimePicker.dayIndex].open_time = timeString;
      } else {
        newHours[showTimePicker.dayIndex].close_time = timeString;
      }
      setBusinessHours(newHours);
    }
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 'salon': return 0.33;
      case 'hours': return 0.66;
      case 'services': return 1;
    }
  };

  const handleNext = () => {
    if (currentStep === 'salon') setCurrentStep('hours');
    else if (currentStep === 'hours') setCurrentStep('services');
    else handleSubmit();
  };

  const handleBack = () => {
    if (currentStep === 'hours') setCurrentStep('salon');
    else if (currentStep === 'services') setCurrentStep('hours');
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please enable location services');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      
      // Get address from coordinates
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const formattedAddress = `${address.street}, ${address.city}, ${address.region} ${address.postalCode}`;
        setLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: formattedAddress,
        });
        setSalonDetails(prev => ({
          ...prev,
          address: formattedAddress,
        }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const renderHoursStep = () => (
    <View style={styles.form}>
      {businessHours.map((hour, index) => (
        <View key={hour.day_of_week} style={styles.hourRow}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayText}>
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][hour.day_of_week]}
            </Text>
            <Switch
              value={!hour.is_closed}
              onValueChange={(value) => {
                const newHours = [...businessHours];
                newHours[index].is_closed = !value;
                setBusinessHours(newHours);
              }}
            />
          </View>
          
          {!hour.is_closed && (
            <View style={styles.timeInputs}>
              <TimeSlider
                label="From"
                value={hour.open_time}
                onChange={(time) => {
                  const newHours = [...businessHours];
                  newHours[index].open_time = time;
                  setBusinessHours(newHours);
                }}
              />
              <TimeSlider
                label="To"
                value={hour.close_time}
                onChange={(time) => {
                  const newHours = [...businessHours];
                  newHours[index].close_time = time;
                  setBusinessHours(newHours);
                }}
              />
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderServicesStep = () => (
    <View style={styles.form}>
      {services.map((service, index) => (
        <View key={index} style={styles.serviceCard}>
          <TextInput
            label="Service Name"
            value={service.name}
            onChangeText={(text) => {
              const newServices = [...services];
              newServices[index].name = text;
              setServices(newServices);
            }}
            style={styles.input}
          />
          <TextInput
            label="Description"
            value={service.description}
            onChangeText={(text) => {
              const newServices = [...services];
              newServices[index].description = text;
              setServices(newServices);
            }}
            style={styles.input}
            multiline
          />
          <SegmentedButtons
            value={service.type}
            onValueChange={(value) => {
              const newServices = [...services];
              newServices[index].type = value as 'hair' | 'nail';
              setServices(newServices);
            }}
            buttons={[
              { value: 'hair', label: 'Hair Service' },
              { value: 'nail', label: 'Nail Service' },
            ]}
            style={styles.typeSelector}
          />
          <View style={styles.durationInputs}>
            <TextInput
              label="Male Duration (min)"
              value={service.duration_male.toString()}
              onChangeText={(text) => {
                const newServices = [...services];
                newServices[index].duration_male = parseInt(text) || 0;
                setServices(newServices);
              }}
              style={[styles.input, styles.halfInput]}
              keyboardType="numeric"
            />
            <TextInput
              label="Female Duration (min)"
              value={service.duration_female.toString()}
              onChangeText={(text) => {
                const newServices = [...services];
                newServices[index].duration_female = parseInt(text) || 0;
                setServices(newServices);
              }}
              style={[styles.input, styles.halfInput]}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.priceInputs}>
            <TextInput
              label="Male Price ($)"
              value={service.price_male.toString()}
              onChangeText={(text) => {
                const newServices = [...services];
                newServices[index].price_male = parseFloat(text) || 0;
                setServices(newServices);
              }}
              style={[styles.input, styles.halfInput]}
              keyboardType="numeric"
            />
            <TextInput
              label="Female Price ($)"
              value={service.price_female.toString()}
              onChangeText={(text) => {
                const newServices = [...services];
                newServices[index].price_female = parseFloat(text) || 0;
                setServices(newServices);
              }}
              style={[styles.input, styles.halfInput]}
              keyboardType="numeric"
            />
          </View>
        </View>
      ))}
      <Button
        mode="outlined"
        onPress={() => setServices([...services, {
          name: '',
          description: '',
          duration_male: 30,
          duration_female: 30,
          price_male: 0,
          price_female: 0,
          type: 'hair'
        }])}
        style={styles.addButton}
      >
        Add Service
      </Button>
    </View>
  );

  const handleSubmit = async () => {
    if (!session?.user) return;
    
    try {
      setLoading(true);

      // Create salon without location first
      const { data: salon, error: salonError } = await supabase
        .from('hair_salon')
        .insert({
          name: salonDetails.name,
          address: salonDetails.address,
          phone: salonDetails.phone,
          email: salonDetails.email,
          owner_id: session.user.id,
          // Only include location if it exists, using PostGIS ST_SetSRID and ST_MakePoint
          ...(location && {
            location: `SRID=4326;POINT(${location.longitude} ${location.latitude})`
          })
        })
        .select()
        .single();

      if (salonError) throw salonError;

      // Add business hours
      const { error: hoursError } = await supabase
        .from('business_hours')
        .insert(
          businessHours.map(hour => ({
            salon_id: salon.id,
            day_of_week: hour.day_of_week,
            open_time: hour.open_time,
            close_time: hour.close_time,
            is_closed: hour.is_closed
          }))
        );

      if (hoursError) throw hoursError;

      // Add services
      const { error: servicesError } = await supabase
        .from('services')
        .insert(
          services.map(service => ({
            salon_id: salon.id,
            ...service
          }))
        );

      if (servicesError) throw servicesError;

      if (mode === 'setup') {
        // Update user role to designer if this is initial setup
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'designer' })
          .eq('id', session.user.id);

        if (profileError) throw profileError;
      }

      // Always return to designer tabs
      router.replace('/designer/tabs');

    } catch (error) {
      console.error('Error setting up salon:', error);
      Alert.alert('Error', 'Failed to set up salon');
    } finally {
      setLoading(false);
    }
  };

  const renderSalonStep = () => (
    <Card>
      <Card.Content>
        <TextInput
          label="Salon Name"
          value={salonDetails.name}
          onChangeText={(text) => setSalonDetails({ ...salonDetails, name: text })}
          style={styles.input}
          mode="outlined"
          left={<TextInput.Icon icon="store" />}
        />

        <View style={styles.addressContainer}>
          <TextInput
            label="Address"
            value={salonDetails.address}
            onChangeText={(text) => setSalonDetails({ ...salonDetails, address: text })}
            style={[styles.input, styles.addressInput]}
            mode="outlined"
            left={<TextInput.Icon icon="map-marker" />}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
          <IconButton
            icon="crosshairs-gps"
            mode="contained"
            size={24}
            onPress={getCurrentLocation}
            style={styles.locationButton}
            loading={loading}
          />
        </View>

        <TextInput
          label="Phone"
          value={salonDetails.phone}
          onChangeText={(text) => setSalonDetails({ ...salonDetails, phone: text })}
          style={styles.input}
          keyboardType="phone-pad"
          mode="outlined"
          left={<TextInput.Icon icon="phone" />}
        />
        
        <TextInput
          label="Email"
          value={salonDetails.email}
          onChangeText={(text) => setSalonDetails({ ...salonDetails, email: text })}
          style={styles.input}
          keyboardType="email-address"
          mode="outlined"
          left={<TextInput.Icon icon="email" />}
        />
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <ProgressBar 
              progress={getStepProgress()} 
              style={styles.progress}
              color="#FFFFFF"
            />
            <Text style={styles.stepIndicator}>
              Step {currentStep === 'salon' ? '1' : currentStep === 'hours' ? '2' : '3'} of 3
            </Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={styles.scrollContentContainer}
        >
          <View style={styles.cardWrapper}>
            <Card>
              <Card.Content>
                {currentStep === 'salon' && renderSalonStep()}
                {currentStep === 'hours' && renderHoursStep()}
                {currentStep === 'services' && renderServicesStep()}
              </Card.Content>
            </Card>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerButtons}>
            {currentStep !== 'salon' && (
              <Button 
                mode="outlined" 
                onPress={handleBack}
                style={styles.backButton}
                labelStyle={styles.buttonLabel}
              >
                Back
              </Button>
            )}
            <Button 
              mode="contained" 
              onPress={handleNext}
              loading={loading}
              style={[
                styles.nextButton,
                currentStep === 'salon' && styles.fullWidthButton
              ]}
              labelStyle={styles.buttonLabel}
            >
              {currentStep === 'services' ? 'Complete Setup' : 'Next Step'}
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGNER_COLORS.primary,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: SPACING.md,
    backgroundColor: DESIGNER_COLORS.primary,
    elevation: 4,
  },
  progressContainer: {
    marginTop: SPACING.xs,
  },
  progress: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepIndicator: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: SPACING.xs,
    fontSize: 12,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: SPACING.md,
  },
  cardWrapper: {
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  input: {
    marginBottom: SPACING.lg,
    backgroundColor: '#FFFFFF',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  locationButton: {
    marginTop: 6,
    backgroundColor: DESIGNER_COLORS.primary,
    borderRadius: 20,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  backButton: {
    flex: 1,
    borderColor: DESIGNER_COLORS.primary,
  },
  nextButton: {
    flex: 2,
    height: 50,
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: DESIGNER_COLORS.primary,
  },
  fullWidthButton: {
    flex: 1,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  hourRow: {
    marginBottom: SPACING.xl,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  dayText: {
    fontSize: 20,
  },
  timeInputs: {
    marginTop: SPACING.md,
  },
  serviceCard: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  durationInputs: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  priceInputs: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  addButton: {
    marginTop: SPACING.md,
  },
  typeSelector: {
    marginBottom: SPACING.md,
  },
  addressInput: {
    flex: 1,
    minHeight: 80,
  },
}); 