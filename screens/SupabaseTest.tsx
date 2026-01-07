// TestSupabase.tsx
import React, { useEffect } from "react";
import { View, Text, Alert } from "react-native";
import { supabase } from "../src/lib/supabase";

// utilitario para convertir base64 a Uint8Array
const base64ToUint8Array = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export default function TestSupabase() {
  useEffect(() => {
    const testSupabase = async () => {
      try {
        // 🔑 Obtener usuario autenticado
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.log("❌ Error obteniendo usuario:", userError.message);
          return;
        }

        const userId = userData.user?.id;
        if (!userId) {
          console.log("⚠️ No hay usuario autenticado. Loguéate antes de probar.");
          return;
        }

        console.log("Usuario autenticado:", userId);

        // 🔹 Imagen dummy (1x1 pixel blanco en base64)
        const base64Image =
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
        const binary = base64ToUint8Array(base64Image);

        const filePath = `test/${Date.now()}.png`;

        // 🔹 Subir a Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("plants")
          .upload(filePath, binary, {
            contentType: "image/png",
          });

        if (uploadError) {
          console.log("❌ Error subiendo imagen:", uploadError.message);
          return;
        }

        // 🔹 Obtener URL pública
        const { data: publicUrlData } = supabase.storage
          .from("plants")
          .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;
        console.log("✅ Imagen subida:", publicUrl);

        // 🔹 Insertar registro en la tabla plants
        const { data, error: insertError } = await supabase
          .from("plants")
          .insert([
            {
              user_id: userId,
              name: "🌱 Planta de test",
              description: "Insert de prueba desde TestSupabase",
              image_url: publicUrl,
            },
          ])
          .select();

        if (insertError) {
          console.log("❌ Error insertando:", insertError.message);
        } else {
          console.log("✅ Insert correcto:", data);
          Alert.alert("Éxito", "Imagen y registro insertados correctamente 🚀");
        }
      } catch (err) {
        console.error("🔥 Error en testSupabase:", err);
      }
    };

    testSupabase();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Ejecutando test de Supabase...</Text>
    </View>
  );
}
