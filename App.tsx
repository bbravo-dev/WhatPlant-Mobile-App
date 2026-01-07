// App.tsx
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import ResultScreen from './screens/ResultScreen';
import MyPlantsScreen from './screens/MyPlantsScreen';
import RemindersScreen from './screens/RemindersScreen';
import LoginScreen from './screens/Login';
import TestSupabase from './screens/SupabaseTest';
import { ThemeProvider, useTheme } from './src/components/ThemeContext';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { theme } = useTheme();

  return (
    <NavigationContainer theme={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: theme === 'dark' ? '#222' : '#d4f3e3' },
          headerTintColor: theme === 'dark' ? '#fff' : '#228B22',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ title: 'Escanear planta' }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{ headerShown: false, title: 'Resultado' }}
        />
        <Stack.Screen
          name="MyPlants"
          component={MyPlantsScreen}
          options={{ title: 'Mis Plantas' }}
        />
        <Stack.Screen
          name="Reminders"
          component={RemindersScreen}
          options={{ title: 'Recordatorio' }}
        />
        <Stack.Screen
          name="TestSupabase"
          component={TestSupabase}
          options={{ title: 'Prueba Supabase' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
