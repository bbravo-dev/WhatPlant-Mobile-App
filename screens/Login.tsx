import {
  View,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
  ImageBackground,
  Image,
} from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

WebBrowser.maybeCompleteAuthSession();

type RootStackParamList = {
  Home: {
    user: {
      id: string;
      name: string | null;
      email: string;
      photo: string | null;
      familyName: string | null;
      givenName: string | null;
    };
  };
};

export default function LoginScreen() {
  const navigation =
    useNavigation<import('@react-navigation/native').NavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      webClientId:
        '384299804122-3j13t1bgkmrcs7u8217pv3vdhl9r8dqb.apps.googleusercontent.com',
    });
  }, []);

  const handleGoogleSingIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (userInfo.data?.idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: userInfo.data.idToken,
        });

        if (error) {
          Alert.alert('Error', error.message);
        } else {
          navigation.navigate('Home', { user: userInfo.data.user });
        }
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Inicio de sesión cancelado');
      } else {
        Alert.alert('Error', error.message ?? 'Error desconocido');
      }
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Ingrese usuario y contraseña');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else if (data.user) {
      navigation.navigate('Home', {
        user: {
          id: data.user.id,
          email: data.user.email ?? '',
          name: null,
          photo: null,
          familyName: null,
          givenName: null,
        },
      });
    }
  };

  
  return (
    <ImageBackground source={require('../assets/fondo.png')} style={styles.background}>
      <StatusBar translucent backgroundColor="transparent" style="light" />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior="padding"
        keyboardVerticalOffset={40}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            <View style={styles.formContainer}>
              <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSingIn}>
                <View style={styles.googleContent}>
                  <Image source={require('../assets/google.jpeg')} style={styles.googleIcon} />
                  <Text style={styles.googleText}>Iniciar sesión con Google</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.form}>
                <Text style={styles.demoText}>Just for demo users</Text>

                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                />

                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  secureTextEntry
                  returnKeyType="done"
                />

                <TouchableOpacity style={styles.emailButton} onPress={handleEmailLogin}>
                  <Text style={styles.emailButtonText}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingTop: 80,        
    paddingBottom: 40,     
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  formContainer: {
    width: '100%',
    paddingTop: 350,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  googleButton: {
    width: '100%',
    backgroundColor: 'white',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  form: {
    width: '100%',
  },
  input: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  emailButton: {
    width: '100%',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  emailButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  demoText: {
    marginBottom: 12,
    fontSize: 20,
    color: '#01040cff',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
