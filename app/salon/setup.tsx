import { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Surface, Switch, ProgressBar, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/services/supabase';
import { COLORS, SPACING } from '../../src/constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import axios from 'axios';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

export default function SalonSetup() {
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
    { day: 'Sunday', isOpen: false, open_time: '09:00', close_time: '17:00', day_of_week: 0 },
    { day: 'Monday', isOpen: true, open_time: '09:00', close_time: '17:00', day_of_week: 1 },
    { day: 'Tuesday', isOpen: true, open_time: '09:00', close_time: '17:00', day_of_week: 2 },
    { day: 'Wednesday', isOpen: true, open_time: '09:00', close_time: '17:00', day_of_week: 3 },
    { day: 'Thursday', isOpen: true, open_time: '09:00', close_time: '17:00', day_of_week: 4 },
    { day: 'Friday', isOpen: true, open_time: '09:00', close_time: '17:00', day_of_week: 5 },
    { day: 'Saturday', isOpen: false, open_time: '09:00', close_time: '17:00', day_of_week: 6 },
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
        <View key={hour.day} style={styles.hourRow}>
          <View style={styles.dayHeader}>
            <Text variant="bodyLarge">{hour.day}</Text>
            <Switch
              value={hour.isOpen}
              onValueChange={(value) => {
                const newHours = [...businessHours];
                newHours[index].isOpen = value;
                setBusinessHours(newHours);
              }}
            />
          </View>
          
          {hour.isOpen && (
            <View style={styles.timeInputs}>
              <View style={styles.timeInput}>
                <Text>From</Text>
                <TextInput
                  value={hour.open_time}
                  onChangeText={(text) => {
                    const newHours = [...businessHours];
                    newHours[index].open_time = text;
                    setBusinessHours(newHours);
                  }}
                  style={styles.input}
                />
              </View>
              <View style={styles.timeInput}>
                <Text>To</Text>
                <TextInput
                  value={hour.close_time}
                  onChangeText={(text) => {
                    const newHours = [...businessHours];
                    newHours[index].close_time = text;
                    setBusinessHours(newHours);
                  }}
                  style={styles.input}
                />
              </View>
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
    if (!session?.user || !location) return;
    
    try {
      setLoading(true);

      // 1. Update user role
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'designer' })
        .eq('id', session.user.id);

      if (roleError) throw roleError;

      // 2. Create salon with location
      const { data: salon, error: salonError } = await supabase
        .from('hair_salon')
        .insert({
          owner_id: session.user.id,
          name: salonDetails.name,
          address: location.address,
          phone: salonDetails.phone,
          email: salonDetails.email,
          location: `POINT(${location.longitude} ${location.latitude})` // PostGIS format
        })
        .select()
        .single();

      if (salonError) throw salonError;

      // 3. Add business hours
      const hoursData = businessHours.map(hour => ({
        salon_id: salon.id,
        day_of_week: hour.day_of_week,
        open_time: hour.open_time,
        close_time: hour.close_time,
        is_closed: !hour.isOpen
      }));

      const { error: hoursError } = await supabase
        .from('business_hours')
        .insert(hoursData);

      if (hoursError) throw hoursError;

      // 4. Add services
      const servicesData = services.map(service => ({
        salon_id: salon.id,
        name: service.name,
        description: service.description,
        duration_male: service.duration_male,
        duration_female: service.duration_female,
        price_male: service.price_male,
        price_female: service.price_female,
        type: service.type
      }));

      const { error: servicesError } = await supabase
        .from('services')
        .insert(servicesData);

      if (servicesError) throw servicesError;

      Alert.alert('Success', 'Salon setup complete!');
      router.replace('/tabs');

    } catch (error) {
      console.error('Error creating salon:', error);
      Alert.alert('Error', 'Failed to create salon');
    } finally {
      setLoading(false);
    }
  };

  const renderSalonStep = () => (
    <View style={styles.form}>
      <TextInput
        label="Salon Name"
        value={salonDetails.name}
        onChangeText={(text) => setSalonDetails({ ...salonDetails, name: text })}
        style={styles.input}
      />
      
      <View style={styles.addressContainer}>
        <TextInput
          label="Address"
          value={salonDetails.address}
          onChangeText={(text) => setSalonDetails({ ...salonDetails, address: text })}
          style={[styles.input, { flex: 1 }]}
        />
        <Button
          mode="contained"
          onPress={getCurrentLocation}
          loading={loading}
          style={styles.locationButton}
          icon={({ size, color }) => (
            <MaterialCommunityIcons name="crosshairs-gps" size={size} color={color} />
          )}
        >
          Get Location
        </Button>
      </View>

      <TextInput
        label="Phone"
        value={salonDetails.phone}
        onChangeText={(text) => setSalonDetails({ ...salonDetails, phone: text })}
        style={styles.input}
        keyboardType="phone-pad"
      />
      
      <TextInput
        label="Email"
        value={salonDetails.email}
        onChangeText={(text) => setSalonDetails({ ...salonDetails, email: text })}
        style={styles.input}
        keyboardType="email-address"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Surface style={styles.header}>
        <Text variant="headlineMedium">Salon Setup</Text>
        <ProgressBar progress={getStepProgress()} style={styles.progress} />
      </Surface>

      <ScrollView style={styles.content}>
        {currentStep === 'salon' && renderSalonStep()}
        {currentStep === 'hours' && renderHoursStep()}
        {currentStep === 'services' && renderServicesStep()}
      </ScrollView>

      <Surface style={styles.footer}>
        {currentStep !== 'salon' && (
          <Button mode="outlined" onPress={handleBack}>
            Back
          </Button>
        )}
        <Button 
          mode="contained" 
          onPress={handleNext}
          loading={loading}
        >
          {currentStep === 'services' ? 'Complete' : 'Next'}
        </Button>
      </Surface>
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
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  segments: {
    marginBottom: SPACING.lg,
  },
  form: {
    gap: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface,
  },
  buttons: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  button: {
    padding: SPACING.sm,
  },
  progress: {
    marginTop: SPACING.md,
  },
  hourRow: {
    marginBottom: SPACING.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  timeInputs: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  timeInput: {
    flex: 1,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  typeSelector: {
    marginBottom: SPACING.md,
  },
  addressContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  locationButton: {
    marginTop: 6, // Align with TextInput
  },
}); 