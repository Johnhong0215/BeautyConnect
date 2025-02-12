import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Animated, TouchableWithoutFeedback, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Text, Surface, Card, Button, ActivityIndicator, Searchbar, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region, Callout } from 'react-native-maps';
import { useBooking } from '../../src/contexts/BookingContext';
import { COLORS, SPACING } from '../../src/constants/theme';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { getDistance } from 'geolib';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { Salon } from '@/types/database';
import { useRouter } from 'expo-router';

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface SalonWithDistance extends Salon {
  distance: number;
  index: number;
}

interface SalonResponse {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
}

export default function SelectSalon() {
  const mapRef = useRef<MapView>(null);
  const { getNearbyHairSalons, handleSalonSelect: handleSalonBooking } = useBooking();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salons, setSalons] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSalons, setFilteredSalons] = useState<any[]>([]);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const listRef = useRef<ScrollView>(null);
  const [sortedSalons, setSortedSalons] = useState<SalonWithDistance[]>([]);
  const [salonCoordinates, setSalonCoordinates] = useState<Record<string, { latitude: number; longitude: number }>>({});

  const mapAnimation = useRef(new Animated.Value(0.6)).current;
  const scrollOffset = useRef(0);
  const isAnimating = useRef(false);

  const expandMap = () => {
    if (!isAnimating.current) {
      isAnimating.current = true;
      Animated.spring(mapAnimation, {
        toValue: 0.8,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }).start(() => {
        isAnimating.current = false;
      });
    }
  };

  const expandList = () => {
    if (!isAnimating.current) {
      isAnimating.current = true;
      Animated.spring(mapAnimation, {
        toValue: 0.3,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }).start(() => {
        isAnimating.current = false;
      });
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    
    // Expand list when user starts scrolling down
    if (currentOffset > 0 && scrollOffset.current === 0) {
      expandList();
    }
    
    scrollOffset.current = currentOffset;
  };

  // Adjust these values for closer zoom
  const DEFAULT_DELTA = {
    latitudeDelta: 0.01, // Reduced from 0.0922 for closer zoom
    longitudeDelta: 0.01, // Reduced from 0.0421 for closer zoom
  };

  useEffect(() => {
    loadUserLocationAndSalons();
  }, []);

  useEffect(() => {
    if (userLocation) {
      sortSalonsByDistance();
    }
  }, [userLocation, salons]);

  const sortSalonsByDistance = () => {
    if (!userLocation) return;

    const sorted = [...salons].filter(salon => salon.location?.latitude && salon.location?.longitude)
      .sort((a, b) => {
        const distanceA = getDistance(
          { latitude: a.location.latitude, longitude: a.location.longitude },
          userLocation
        );
        const distanceB = getDistance(
          { latitude: b.location.latitude, longitude: b.location.longitude },
          userLocation
        );
        return distanceA - distanceB;
      });

    const filtered = sorted.filter(salon => 
      salon.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredSalons(filtered);
  };

  const loadUserLocationAndSalons = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location services to find nearby salons.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const userLoc: UserLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      console.log('User location:', userLoc); // Debug log

      setUserLocation(userLoc);
      setMapRegion({
        latitude: userLoc.latitude,
        longitude: userLoc.longitude,
        latitudeDelta: DEFAULT_DELTA.latitudeDelta,
        longitudeDelta: DEFAULT_DELTA.longitudeDelta,
      });

      // Fetch nearby salons using the Supabase function
      const { data: salonsData, error } = await supabase
        .rpc('nearby_salons', {
          search_lat: userLoc.latitude,
          search_lng: userLoc.longitude,
          radius_meters: 5000
        });

      console.log('Raw salons data:', salonsData); // Debug log
      console.log('Supabase error:', error); // Debug log

      if (error) throw error;
      if (!salonsData || !Array.isArray(salonsData)) {
        console.log('No salons data or invalid format');
        setSortedSalons([]);
        setFilteredSalons([]);
        return;
      }

      // Map results to correct format with type checking
      const salonsWithDistance = salonsData
        .map((salon, index) => ({
          id: salon.id,
          name: salon.name,
          address: salon.address,
          location: {
            latitude: salon.latitude,
            longitude: salon.longitude
          },
          distance: salon.distance,
          index: index + 1
        }));

      console.log('Processed salons:', salonsWithDistance); // Debug log

      setSortedSalons(salonsWithDistance);
      setFilteredSalons(salonsWithDistance);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load nearby salons');
    } finally {
      setLoading(false);
    }
  };

  const handleLocateMe = async () => {
    try {
      setLoading(true);
      await loadUserLocationAndSalons();
      if (mapRef.current && userLocation) {
        mapRef.current.animateToRegion({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          ...DEFAULT_DELTA,
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    sortSalonsByDistance();
  };

  // Calculate dynamic styles based on animation
  const mapContainerStyle = {
    flex: mapAnimation,
  };

  const listContainerStyle = {
    flex: Animated.subtract(1, mapAnimation),
  };

  const handleSalonSelect = async (salonId: string) => {
    // If already selected, navigate to service selection
    if (selectedSalonId === salonId) {
      const selectedSalon = sortedSalons.find(s => s.id === salonId);
      if (selectedSalon) {
        // Get the complete salon data including services
        const { data: salonData, error } = await supabase
          .from('hair_salon')
          .select(`
            *,
            services (*)
          `)
          .eq('id', salonId)
          .single();

        if (error) {
          console.error('Error fetching salon data:', error);
          return;
        }

        // Pass the complete salon data to the booking context
        handleSalonBooking(salonData);
        router.push('/booking/service-selection');
      }
      return;
    }

    // First click - select and focus on salon
    setSelectedSalonId(salonId);
    const selectedSalon = sortedSalons.find(s => s.id === salonId);
    
    if (selectedSalon && mapRef.current) {
      const coordinates = salonCoordinates[salonId];
      if (coordinates) {
        mapRef.current.animateToRegion({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          latitudeDelta: DEFAULT_DELTA.latitudeDelta / 2,
          longitudeDelta: DEFAULT_DELTA.longitudeDelta / 2,
        }, 500);
      }
    }
  };

  const fetchSalonCoordinates = async (salonId: string) => {
    const { data, error } = await supabase
      .rpc('get_salon_coordinates', {
        salon_id: salonId
      });

    if (error) {
      console.error('Error fetching coordinates:', error);
      return null;
    }

    if (data && data[0]) {
      setSalonCoordinates(prev => ({
        ...prev,
        [salonId]: {
          latitude: data[0].latitude,
          longitude: data[0].longitude
        }
      }));
      return data[0];
    }
    return null;
  };

  const renderMarker = (salon: SalonWithDistance) => {
    const coordinates = salonCoordinates[salon.id];
    
    if (!coordinates) {
      // Fetch coordinates if we don't have them yet
      fetchSalonCoordinates(salon.id);
      return null;
    }

    return (
      <Marker
        key={salon.id}
        coordinate={coordinates}
        onPress={() => handleSalonSelect(salon.id)}
      >
        <View style={[
          styles.markerContainer,
          selectedSalonId === salon.id && styles.selectedMarker
        ]}>
          <Text style={styles.markerText}>{salon.index}</Text>
        </View>
        <Callout>
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{salon.name}</Text>
            <Text>{salon.address}</Text>
            <Text>({coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)})</Text>
          </View>
        </Callout>
      </Marker>
    );
  };

  useEffect(() => {
    sortedSalons.forEach(salon => {
      if (!salonCoordinates[salon.id]) {
        fetchSalonCoordinates(salon.id);
      }
    });
  }, [sortedSalons]);

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

      {/* Map Container */}
      <Animated.View 
        style={[styles.topContainer, mapContainerStyle]}
        onTouchStart={expandMap}
      >
        <Searchbar
          placeholder="Search by salon name or location"
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <View style={styles.mapContainer}>
          {userLocation && mapRegion && (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={mapRegion}
              showsUserLocation={true}
              followsUserLocation={false}
            >
              <Marker
                coordinate={userLocation}
                title="You are here"
                pinColor="blue"
              />
              {sortedSalons.map(renderMarker)}
            </MapView>
          )}
          
          <View style={styles.locateButtonContainer}>
            <IconButton
              icon="crosshairs-gps"
              mode="contained"
              onPress={handleLocateMe}
              size={24}
            />
          </View>
        </View>
      </Animated.View>

      {/* Salon List Container */}
      <Animated.View style={[styles.bottomContainer, listContainerStyle]}>
        <View style={styles.listHeader}>
          <Text variant="titleMedium">Nearby Salons</Text>
        </View>
        <ScrollView 
          ref={listRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {sortedSalons.map((salon: SalonWithDistance) => (
            <Card 
              key={salon.id} 
              style={[
                styles.card,
                selectedSalonId === salon.id && styles.selectedCard
              ]}
              onPress={() => handleSalonSelect(salon.id)}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.indexContainer}>
                  <Text style={styles.indexText}>{salon.index}</Text>
                </View>
                <View style={styles.salonInfo}>
                  <Text variant="titleMedium">{salon.name}</Text>
                  <Text variant="bodyMedium">{salon.address}</Text>
                  <Text variant="bodySmall">
                    {(salon.distance / 1000).toFixed(1)} km away
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      </Animated.View>
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
  topContainer: {
    overflow: 'hidden',
  },
  searchbar: {
    margin: SPACING.md,
    marginBottom: SPACING.xs, // Reduced margin to give more space to map
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  locateButtonContainer: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toggleIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: SPACING.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bottomContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  card: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    padding: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  selectedMarker: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 1.1 }],
  },
  markerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  callout: {
    padding: SPACING.xs,
    minWidth: 150,
  },
  calloutTitle: {
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  selectedCard: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indexContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  indexText: {
    color: 'white',
    fontWeight: 'bold',
  },
  salonInfo: {
    flex: 1,
  },
});