import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';

export default function ServiceSelection() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Hair Analysis
      </Text>
      <Text variant="bodyLarge" style={styles.description}>
        Take a photo of your hair to get AI-powered style recommendations
      </Text>
      <Button 
        mode="contained" 
        onPress={() => router.push('/booking/camera')}
        style={styles.button}
      >
        Take Photo
      </Button>
      <Button 
        mode="outlined" 
        onPress={() => router.push('/booking/gallery')}
        style={styles.button}
      >
        Choose from Gallery
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  button: {
    marginVertical: 8,
  },
}); 