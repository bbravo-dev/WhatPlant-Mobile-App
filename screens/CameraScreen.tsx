// screens/CameraScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Dimensions,
  TouchableOpacity, Alert, Platform
} from 'react-native';
import {
  CameraView, CameraType, useCameraPermissions, FlashMode
} from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { BlurView } from 'expo-blur';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CameraScreen({ navigation, route }: any) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [hasPermission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (route.params?.fromGallery && route.params?.imageUri) {
      const { imageUri, base64 } = route.params;
      setIsLoading(true);
      identifyPlant(base64, imageUri);
    }
  }, [route.params]);

  useEffect(() => {
    (async () => {
      if (!hasPermission) await requestPermission();
    })();
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current || !isCameraReady) {
      Alert.alert('Error', 'La cámara no está lista');
      return;
    }

    try {
      setIsLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        skipProcessing: true
      });

      if (photo?.base64) {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 800 } }],
          { base64: true, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        identifyPlant(manipulatedImage.base64!, manipulatedImage.uri);
      } else {
        throw new Error('No se pudo capturar la imagen');
      }
    } catch (error: any) {
      console.error('Error al tomar la foto:', error);
      Alert.alert('Error', 'No se pudo capturar la imagen: ' + error.message);
      setIsLoading(false);
    }
  };

  const identifyPlant = async (base64: string, imageUri: string) => {
    const apiKey = 'YOUR_API_KEY';
    const project = 'all';

    const formData = new FormData();
    formData.append('images', {
      uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any);
    formData.append('organs', 'leaf');

    try {
      const response = await fetch(
        `https://my-api.plantnet.org/v2/identify/${project}?api-key=${apiKey}`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Error en respuesta:', data);
        Alert.alert('Error', 'Error en la identificación: ' + (data.message || 'Unknown error'));
        return;
      }

      navigation.navigate('Result', {
        result: data,
        imageUrl: imageUri,
        base64Image: `data:image/jpeg;base64,${base64}`,
      });
    } catch (error: any) {
      console.error('Error al conectar con PlantNet:', error);
      Alert.alert('Error', 'Error de conexión: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFlash = () => setFlash(prev => prev === 'on' ? 'off' : 'on');

  if (hasPermission === null) {
    return <ActivityIndicator size="large" color="#00cc88" style={{ flex: 1 }} />;
  }

  if (hasPermission && !hasPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Sin permiso para acceder a la cámara
        </Text>
        <Feather name="camera-off" size={100} color="black" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#00cc88" />
            <Text style={styles.loadingText}>Escaneando planta...</Text>
          </View>
        </View>
      )}

      {!route.params?.fromGallery && (
        <>
          <CameraView
            style={styles.camera}
            facing={facing}
            ref={cameraRef}
            flash={flash}
            onCameraReady={() => setIsCameraReady(true)}
            onMountError={() => Alert.alert('Error', 'Error al cargar la cámara')}
          />

          <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
            <Ionicons
              name={flash === 'on' ? 'flash' : 'flash-off'}
              size={28}
              color="white"
            />
          </TouchableOpacity>

          <View style={styles.overlayButton}>
            <TouchableOpacity 
              style={[styles.captureButton, (!isCameraReady || isLoading) && styles.disabledButton]}
              onPress={takePicture}
              disabled={!isCameraReady || isLoading}
            >
              <View style={styles.innerCircle} />
            </TouchableOpacity>
            
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  permissionContainer: { 
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 
  },
  permissionText: { 
    textAlign: 'center', fontSize: 20, color: 'red', marginBottom: 20 
  },
  camera: { flex: 1 },
  overlayButton: { 
    position: 'absolute', bottom: 40, alignSelf: 'center', alignItems: 'center'
  },
  flashButton: {
    position: 'absolute', top: 50, right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 30,
    elevation: 5, // sombra Android
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  captureButton: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
  },
  innerCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#00cc88',
  },
  captureLabel: {
    marginTop: 10, color: 'white', fontSize: 16, fontWeight: '600'
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingOverlay: { 
    justifyContent: 'center', alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 15, fontSize: 18, color: '#006644', fontWeight: '600' 
  },
});
