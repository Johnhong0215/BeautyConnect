import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, Surface, Button, Portal, Modal, TextInput, Divider, List, IconButton, Switch, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SPACING, DESIGNER_COLORS } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TimeSlider from '../../src/components/TimeSlider';

interface Salon {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface BusinessHour {
  id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface Service {
  id?: string;
  name: string;
  description: string;
  duration_male: number;
  duration_female: number;
  price_male: number;
  price_female: number;
  type: 'hair' | 'nail';
  salon_id: string;
  created_at?: string;
}

export default function SalonDetails() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [editingSalon, setEditingSalon] = useState(false);
  const [editingHours, setEditingHours] = useState(false);
  const [editingService, setEditingService] = useState<string | null>(null);

  useEffect(() => {
    fetchSalonDetails();
  }, [params.id]);

  const fetchSalonDetails = async () => {
    try {
      // Fetch salon info
      const { data: salonData } = await supabase
        .from('hair_salon')
        .select('*')
        .eq('id', params.id)
        .single();

      // Fetch business hours
      const { data: hoursData } = await supabase
        .from('business_hours')
        .select('*')
        .eq('salon_id', params.id)
        .order('day_of_week');

      // Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', params.id);

      // Fetch upcoming appointments
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          profiles (full_name),
          guests (full_name),
          services (name)
        `)
        .eq('salon_id', params.id)
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .order('appointment_date', { ascending: true });

      setSalon(salonData);
      setBusinessHours(hoursData || []);
      setServices(servicesData || []);
      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error fetching salon details:', error);
      Alert.alert('Error', 'Failed to load salon details');
    }
  };

  const handleSalonUpdate = async (updatedSalon: Partial<Salon>) => {
    try {
      const { error } = await supabase
        .from('hair_salon')
        .update(updatedSalon)
        .eq('id', params.id);

      if (error) throw error;
      fetchSalonDetails();
      setEditingSalon(false);
    } catch (error) {
      console.error('Error updating salon:', error);
      Alert.alert('Error', 'Failed to update salon information');
    }
  };

  const handleHoursUpdate = async (updatedHours: BusinessHour[]) => {
    try {
      const { error } = await supabase
        .from('business_hours')
        .upsert(updatedHours.map(hour => ({
          ...hour,
          salon_id: params.id
        })));

      if (error) throw error;
      fetchSalonDetails();
      setEditingHours(false);
    } catch (error) {
      console.error('Error updating hours:', error);
      Alert.alert('Error', 'Failed to update business hours');
    }
  };

  const handleServiceUpdate = async (updatedService: Service) => {
    try {
      if (!updatedService.id) {
        // This is a new service
        const { error } = await supabase
          .from('services')
          .insert({
            ...updatedService,
            salon_id: params.id
          });
        if (error) throw error;
      } else {
        // This is an existing service
        const { error } = await supabase
          .from('services')
          .update(updatedService)
          .eq('id', updatedService.id);
        if (error) throw error;
      }
      
      fetchSalonDetails();
      setEditingService(null);
    } catch (error) {
      console.error('Error updating service:', error);
      Alert.alert('Error', 'Failed to update service');
    }
  };

  const handleDeleteSalon = async () => {
    Alert.alert(
      'Delete Salon',
      'Are you sure you want to delete this salon? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('hair_salon')
                .delete()
                .eq('id', params.id);

              if (error) throw error;
              router.replace('/designer/tabs');
            } catch (error) {
              console.error('Error deleting salon:', error);
              Alert.alert('Error', 'Failed to delete salon');
            }
          }
        }
      ]
    );
  };

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const addNewService = async () => {
    try {
      // Create new service in database first
      const { data, error } = await supabase
        .from('services')
        .insert({
          name: 'New Service',
          description: '',
          duration_male: 30,
          duration_female: 30,
          price_male: 0,
          price_female: 0,
          type: 'hair',
          salon_id: params.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state and start editing
      setServices([...services, data]);
      setEditingService(data.id);
    } catch (error) {
      console.error('Error creating new service:', error);
      Alert.alert('Error', 'Failed to create new service');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', serviceId);

              if (error) throw error;
              fetchSalonDetails();
            } catch (error) {
              console.error('Error deleting service:', error);
              Alert.alert('Error', 'Failed to delete service');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <ScrollView>
          <Card style={styles.card}>
            <Card.Title 
              title="Salon Information" 
              right={(props) => (
                <IconButton {...props} icon="pencil" onPress={() => setEditingSalon(!editingSalon)} />
              )}
            />
            <Card.Content>
              {editingSalon ? (
                <View style={styles.form}>
                  <TextInput
                    label="Name"
                    value={salon?.name}
                    onChangeText={(text) => setSalon(prev => ({ ...prev!, name: text }))}
                    style={styles.input}
                  />
                  <TextInput
                    label="Address"
                    value={salon?.address}
                    onChangeText={(text) => setSalon(prev => ({ ...prev!, address: text }))}
                    style={styles.input}
                  />
                  <TextInput
                    label="Phone"
                    value={salon?.phone}
                    onChangeText={(text) => setSalon(prev => ({ ...prev!, phone: text }))}
                    style={styles.input}
                  />
                  <TextInput
                    label="Email"
                    value={salon?.email}
                    onChangeText={(text) => setSalon(prev => ({ ...prev!, email: text }))}
                    style={styles.input}
                  />
                  <Button mode="contained" onPress={() => handleSalonUpdate(salon!)}>
                    Save Changes
                  </Button>
                </View>
              ) : (
                <View>
                  <Text variant="bodyLarge">Name: {salon?.name}</Text>
                  <Text variant="bodyLarge">Address: {salon?.address}</Text>
                  <Text variant="bodyLarge">Phone: {salon?.phone}</Text>
                  <Text variant="bodyLarge">Email: {salon?.email}</Text>
                </View>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title 
              title="Business Hours" 
              right={(props) => (
                <IconButton {...props} icon="pencil" onPress={() => {
                  if (editingHours) {
                    handleHoursUpdate(businessHours);
                  }
                  setEditingHours(!editingHours);
                }} />
              )}
            />
            <Card.Content>
              {businessHours.map((hour) => (
                <View key={hour.id} style={styles.hourRow}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayText}>
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][hour.day_of_week]}
                    </Text>
                    <Switch
                      value={!hour.is_closed}
                      disabled={!editingHours}
                      onValueChange={(value) => {
                        if (!editingHours) return;
                        const updated = businessHours.map(h =>
                          h.id === hour.id ? { ...h, is_closed: !value } : h
                        );
                        setBusinessHours(updated);
                      }}
                    />
                  </View>
                  
                  {!hour.is_closed && (
                    <View style={styles.timeInputs}>
                      <TimeSlider
                        label="From"
                        value={hour.open_time}
                        disabled={!editingHours}
                        onChange={(time) => {
                          if (!editingHours) return;
                          const updated = businessHours.map(h =>
                            h.id === hour.id ? { ...h, open_time: time } : h
                          );
                          setBusinessHours(updated);
                        }}
                      />
                      <TimeSlider
                        label="To"
                        value={hour.close_time}
                        disabled={!editingHours}
                        onChange={(time) => {
                          if (!editingHours) return;
                          const updated = businessHours.map(h =>
                            h.id === hour.id ? { ...h, close_time: time } : h
                          );
                          setBusinessHours(updated);
                        }}
                      />
                    </View>
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title 
              title="Services" 
              right={(props) => (
                <IconButton {...props} icon="plus" onPress={addNewService} />
              )}
            />
            <Card.Content>
              {services.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <List.Accordion
                    title={service.name}
                    description={service.type}
                    left={props => <List.Icon {...props} icon="content-cut" />}
                  >
                    {editingService === service.id ? (
                      <View style={styles.form}>
                        <TextInput
                          label="Name"
                          value={service.name}
                          onChangeText={(text) => {
                            const updated = services.map(s =>
                              s.id === service.id ? { ...s, name: text } : s
                            );
                            setServices(updated);
                          }}
                          style={styles.input}
                        />
                        <TextInput
                          label="Description"
                          value={service.description}
                          onChangeText={(text) => {
                            const updated = services.map(s =>
                              s.id === service.id ? { ...s, description: text } : s
                            );
                            setServices(updated);
                          }}
                          style={styles.input}
                          multiline
                        />
                        <View style={styles.row}>
                          <TextInput
                            label="Male Duration (min)"
                            value={service.duration_male.toString()}
                            onChangeText={(text) => {
                              const updated = services.map(s =>
                                s.id === service.id ? { ...s, duration_male: parseInt(text) || 0 } : s
                              );
                              setServices(updated);
                            }}
                            style={[styles.input, styles.halfInput]}
                            keyboardType="numeric"
                          />
                          <TextInput
                            label="Female Duration (min)"
                            value={service.duration_female.toString()}
                            onChangeText={(text) => {
                              const updated = services.map(s =>
                                s.id === service.id ? { ...s, duration_female: parseInt(text) || 0 } : s
                              );
                              setServices(updated);
                            }}
                            style={[styles.input, styles.halfInput]}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.row}>
                          <TextInput
                            label="Male Price ($)"
                            value={service.price_male.toString()}
                            onChangeText={(text) => {
                              const updated = services.map(s =>
                                s.id === service.id ? { ...s, price_male: parseFloat(text) || 0 } : s
                              );
                              setServices(updated);
                            }}
                            style={[styles.input, styles.halfInput]}
                            keyboardType="numeric"
                          />
                          <TextInput
                            label="Female Price ($)"
                            value={service.price_female.toString()}
                            onChangeText={(text) => {
                              const updated = services.map(s =>
                                s.id === service.id ? { ...s, price_female: parseFloat(text) || 0 } : s
                              );
                              setServices(updated);
                            }}
                            style={[styles.input, styles.halfInput]}
                            keyboardType="numeric"
                          />
                        </View>
                        <Button mode="contained" onPress={() => handleServiceUpdate(service)}>
                          Save Service
                        </Button>
                      </View>
                    ) : (
                      <View style={styles.serviceDetails}>
                        <Text variant="bodyMedium">{service.description}</Text>
                        <View style={styles.row}>
                          <View style={styles.halfInput}>
                            <Text>Male</Text>
                            <Text>Duration: {service.duration_male} min</Text>
                            <Text>Price: ${service.price_male}</Text>
                          </View>
                          <View style={styles.halfInput}>
                            <Text>Female</Text>
                            <Text>Duration: {service.duration_female} min</Text>
                            <Text>Price: ${service.price_female}</Text>
                          </View>
                        </View>
                        <View style={styles.serviceActions}>
                          <Button 
                            mode="contained"
                            onPress={() => {
                              if (service.id) {
                                setEditingService(service.id);
                              }
                            }}
                          >
                            Edit Service
                          </Button>
                          <Button 
                            mode="contained"
                            buttonColor={DESIGNER_COLORS.error}
                            onPress={() => service.id && handleDeleteService(service.id)}
                          >
                            Delete
                          </Button>
                        </View>
                      </View>
                    )}
                  </List.Accordion>
                </View>
              ))}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title 
              title="Upcoming Appointments" 
            />
            <Card.Content>
              {appointments.map((appointment) => (
                <List.Item
                  key={appointment.id}
                  title={appointment.profiles?.full_name || appointment.guests?.full_name}
                  description={`${appointment.services.name} - ${appointment.appointment_date} ${appointment.start_time}`}
                  left={props => <List.Icon {...props} icon="calendar" />}
                />
              ))}
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={handleDeleteSalon}
            style={styles.deleteButton}
            textColor="white"
            buttonColor={DESIGNER_COLORS.error}
          >
            Delete Salon
          </Button>
        </ScrollView>
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
    backgroundColor: DESIGNER_COLORS.background,
  },
  card: {
    margin: SPACING.sm,
  },
  form: {
    gap: SPACING.md,
  },
  input: {
    backgroundColor: DESIGNER_COLORS.background,
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
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  serviceDetails: {
    padding: SPACING.md,
  },
  deleteButton: {
    margin: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  serviceItem: {
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: DESIGNER_COLORS.border,
    paddingBottom: SPACING.md,
  },
  serviceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
}); 