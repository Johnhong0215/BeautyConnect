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
        },
      }}
    >
      <Stack.Screen
        name="[id]"
        options={({ route }) => ({
          title: (route.params as { id?: string })?.id === 'add'
            ? 'Add New Business'
            : 'Edit Business',
        })}
      />
    </Stack>
  );
} 