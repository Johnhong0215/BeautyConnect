import { Stack } from 'expo-router';
import { DESIGNER_COLORS } from '../../src/constants/colors';

export default function SalonLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: DESIGNER_COLORS.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 16,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: DESIGNER_COLORS.primary,
        },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="setup"
        options={{
          title: 'Add New Business',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Edit Business',
        }}
      />
    </Stack>
  );
} 