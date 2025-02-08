import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function Appointments() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">My Appointments</Text>
      <Text variant="bodyLarge">No appointments scheduled</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
}); 