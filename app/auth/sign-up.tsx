import { useState, useRef } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, ScrollView, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, TextInput, Text } from 'react-native-paper';
// Import your Supabase client (ensure you have this configured)
import { supabase } from '../../src/services/supabase';
import { SPACING } from '../../src/constants/theme';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView | null>(null);

  const handleSignUp = async () => {
    try {
      setLoading(true);
      // Create the user in Supabase
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        throw error;
      }
      // Welcome the user upon successful sign up
      Alert.alert('Welcome', `Welcome ${email}! Your account has been created successfully.`);
      // Redirect to the sign-in screen with the email prefilled
      router.replace(`/auth/sign-in?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Sign Up Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={handleSignUp}
              loading={loading}
              style={styles.button}
            >
              Sign Up
            </Button>
            <Button
              mode="text"
              onPress={() => router.push('/auth/sign-in')}
              style={styles.button}
            >
              Already have an account? Sign In
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
});
