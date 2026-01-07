// supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// 🚀 Obtención de credenciales desde app.config.json (expo-constants)


const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey as string;

// 🔍 Validación temprana
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '❌ Faltan supabaseUrl o supabaseKey en app.config.json. Verifica la configuración en extra.'
  );
}

// ✅ Crear cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// 🧪 Función opcional para probar la conexión
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('plants').select('*').limit(1);
    if (error) {
      console.error('❌ Error de conexión con Supabase:', error.message);
    } else {
      console.log('✅ Conexión exitosa a Supabase:', data);
    }
  } catch (err) {
    console.error('⚠️ Error crítico al probar conexión con Supabase:', err);
  }
}
