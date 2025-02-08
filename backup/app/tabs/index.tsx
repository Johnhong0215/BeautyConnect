import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

export default function HomeScreen() {
  const { session } = useAuth();

  const services = [
    {
      id: 1,
      name: 'Haircut',
      description: 'Professional haircut service',
      image: 'https://placeholder.com/300x200',
    },
    {
      id: 2,
      name: 'Hair Coloring',
      description: 'Full hair coloring service',
      image: 'https://placeholder.com/300x200',
    },
    {
      id: 3,
      name: 'Hair Treatment',
      description: 'Revitalizing hair treatment',
      image: 'https://placeholder.com/300x200',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Welcome back!</Text>
        <Text variant="bodyLarge">{session?.user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Our Services
        </Text>
        {services.map((service) => (
          <Card key={service.id} style={styles.card}>
            <Card.Cover source={{ uri: service.image }} />
            <Card.Title title={service.name} />
            <Card.Content>
              <Text variant="bodyMedium">{service.description}</Text>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => router.push('/booking/service')}>
                Book Now
              </Button>
            </Card.Actions>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
}); 