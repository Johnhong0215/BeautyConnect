import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Button, Text } from 'react-native-paper';
import { router } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.back);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const libraryStatus = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted' && libraryStatus.status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        await MediaLibrary.saveToLibraryAsync(photo.uri);
        router.push({
          pathname: '/booking/analysis',
          params: { imageUri: photo.uri }
        });
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained"
            onPress={() => setType(type === CameraType.back ? CameraType.front : CameraType.back)}
            style={styles.button}
          >
            Flip Camera
          </Button>
          <Button 
            mode="contained"
            onPress={takePicture}
            style={styles.button}
          >
            Take Photo
          </Button>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    marginVertical: 8,
  },
}); 