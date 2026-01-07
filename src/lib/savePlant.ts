// src/lib/savePlant.ts
import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export const savePlantToSupabase = async ({ name, description, imageUri }: {
  name: string;
  description: string;
  imageUri: string;
}) => {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session?.user?.id) {
      throw new Error('Usuario no autenticado');
    }

    const userId = sessionData.session.user.id;

    // Subida de imagen a Supabase Storage
    const fileExt = imageUri.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `plants/${userId}/${fileName}`;

    const file = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { error: uploadError } = await supabase.storage
      .from('plant-images') // asegúrate que el bucket existe
      .upload(filePath, Buffer.from(file, 'base64'), {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase
      .storage
      .from('plant-images')
      .getPublicUrl(filePath);

    const imageUrl = publicUrl.publicUrl;

    // Inserción en la base de datos
    const { error: insertError } = await supabase.from('Plants').insert([
      {
        Name: name,
        Description: description,
        Image_Url: imageUrl,
        User_Id: userId,
      },
    ]);

    if (insertError) throw insertError;

    return { success: true };
  } catch (error: any) {
    console.error('Error al guardar la planta:', error.message);
    return { success: false, error: error.message };
  }
};
