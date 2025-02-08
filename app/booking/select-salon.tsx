import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Surface, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useBooking } from '../../src/contexts/BookingContext';
import { COLORS, SPACING } from '../../src/constants/theme';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Salon } from '../../src/types/database';

export default function SelectSalon() {
  const { getNearbyHairSalons, handleSalonSelect } = useBooking();
  const [loading, setLoading] = useState(true);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const loadUserLocationAndSalons = async () => {
    try {
      setLoading(true);
      
      // Get user location first
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please enable location services');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      // Then load nearby salons
      const nearbySalons = await getNearbyHairSalons();
      setSalons(nearbySalons);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load nearby salons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserLocationAndSalons();
  }, []);

  const onSalonSelect = (salon: Salon) => {
    handleSalonSelect(salon);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Surface style={styles.header}>
        <Text variant="headlineMedium">Select Salon</Text>
      </Surface>

      {userLocation && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {/* Show user location */}
          <Marker
            coordinate={userLocation}
            title="You are here"
            pinColor="blue"
          />
          
          {/* Show salons */}
          {salons.map(salon => (
            <Marker
              key={salon.id}
              coordinate={{
                latitude: salon.location.latitude,
                longitude: salon.location.longitude,
              }}
              title={salon.name}
              description={salon.address}
            />
          ))}
        </MapView>
      )}

      <ScrollView style={styles.content}>
        {salons.map(salon => (
          <Card 
            key={salon.id} 
            style={styles.card} 
            onPress={() => onSalonSelect(salon)}
          >
            <Card.Content>
              <Text variant="titleMedium">{salon.name}</Text>
              <Text variant="bodyMedium">{salon.address}</Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
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
  map: {
    height: 300,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  card: {
    marginBottom: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 