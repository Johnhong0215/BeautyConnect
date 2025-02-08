import { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../src/services/supabase';

type AnalysisResult = {
  hairType: string;
  recommendations: string[];
  suggestedStyles: string[];
};

export default function AnalysisScreen() {
  const { imageUri } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    analyzeImage();
  }, [imageUri]);

  const analyzeImage = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual AI analysis
      // For now, return mock data
      const mockAnalysis: AnalysisResult = {
        hairType: 'Straight, Fine',
        recommendations: [
          'Use volumizing products',
          'Avoid heavy conditioners',
          'Consider layered cuts',
        ],
        suggestedStyles: [
          'Bob with layers',
          'Long layers with face-framing pieces',
          'Textured pixie cut',
        ],
      };
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAnalysis(mockAnalysis);
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Analyzing your hair...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri as string }} style={styles.image} />
      
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.section}>Hair Analysis</Text>
        <Text variant="bodyLarge">Hair Type: {analysis?.hairType}</Text>

        <Text variant="titleMedium" style={styles.section}>Recommendations</Text>
        {analysis?.recommendations.map((rec, index) => (
          <Text key={index} variant="bodyMedium" style={styles.listItem}>• {rec}</Text>
        ))}

        <Text variant="titleMedium" style={styles.section}>Suggested Styles</Text>
        {analysis?.suggestedStyles.map((style, index) => (
          <Text key={index} variant="bodyMedium" style={styles.listItem}>• {style}</Text>
        ))}

        <Button 
          mode="contained"
          onPress={() => router.push('/booking/appointment')}
          style={styles.button}
        >
          Book Appointment
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  listItem: {
    marginBottom: 4,
  },
  button: {
    marginTop: 24,
  },
}); 