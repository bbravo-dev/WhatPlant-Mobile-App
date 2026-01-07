// screens/HomeScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../src/lib/supabase";
import { useTheme } from "../src/components/ThemeContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const { width: screenWidth } = Dimensions.get("window");

export default function HomeScreen({ navigation }: any) {
  const { theme, toggleTheme } = useTheme();
  const [weather, setWeather] = useState<string | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const getPrettyNameFromEmail = (email: string | null) => {
    if (!email) return "Usuario";

    return email
      .split("@")[0]
      .replace(/[._-]/g, " ")
      .replace(/\d+/g, "")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .split(" ")[0];
  };
  const userName = getPrettyNameFromEmail(userEmail);

  const isDark = theme === "dark";

  const fetchWeather = async () => {
    setLoadingWeather(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Se necesita acceder a la ubicación.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const apiKey = "YOUR_API_KEY_HERE";
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=es`;

      const response = await fetch(url);
      const data = await response.json();


      if (!data?.weather || !data?.main) {
        setWeather("Clima no disponible");
        return;
      }

      const condition = data.weather[0]?.description;
      const temp = data.main?.temp;

      const sunrise = data.sys?.sunrise;
      const sunset = data.sys?.sunset;
      const now = Math.floor(Date.now() / 1000);

      const isDay = now >= sunrise && now < sunset;

      const conditionWithTime = isDay
        ? `☀️ Día: ${condition} (${temp}°C)`
        : `🌙 Noche: ${condition} (${temp}°C)`;

      setWeather(conditionWithTime);
    } catch (error) {
      console.error("Error obteniendo el clima:", error);
      setWeather("Clima no disponible");
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserEmail(data.user.email ?? null);
      }
    };
    fetchUser();
    fetchWeather();
  }, []);

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Se necesita acceso a la galería.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]) {
      navigation.navigate("Result", {
        fromGallery: true,
        base64: result.assets[0].base64,
        uri: result.assets[0].uri,
      });
    }
  };

  return (
    <ImageBackground
      source={require("../assets/background.jpeg")}
      style={styles.background}
      resizeMode="cover"
      imageStyle={{ opacity: 0.07 }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: isDark ? "#121212" : "rgba(255,255,255,0.8)" },
        ]}
      >
        {userEmail && (
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.userGreeting,
                { color: isDark ? "#fff" : "#000" },
              ]}
              numberOfLines={1}
            >
              👋 Hola, {userName}
            </Text>
            <TouchableOpacity onPress={toggleTheme} activeOpacity={0.7}>
              <MaterialIcons
                name={isDark ? "light-mode" : "dark-mode"}
                size={28}
                color={isDark ? "#fff" : "#000"}
              />
            </TouchableOpacity>
          </View>
        )}

        <Text
          style={[
            styles.appName,
            { color: isDark ? "#90ee90" : "#2e7d32" },
          ]}
        >
          🌿 Bienvenido a What Plant?!
        </Text>
        <Text
          style={[
            styles.appTagline,
            { color: isDark ? "#bbb" : "#4f4f4f" },
          ]}
        >
          Tu asistente inteligente para cuidar tus plantas
        </Text>

        {/* Clima */}
        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? "#1e1e1e" : "#e0f2e9" },
          ]}
        >
          <Text
            style={[styles.cardTitle, { color: isDark ? "#fff" : "#333" }]}
          >
            ☁️ Clima Actual
          </Text>
          {loadingWeather ? (
            <ActivityIndicator size="large" color="#00cc88" />
          ) : (
            <Text
              style={[styles.weatherText, { color: isDark ? "#ddd" : "#555" }]}
            >
              {weather}
            </Text>
          )}
        </View>

        {/* Consejo */}
        <View
          style={[
            styles.tipContainer,
            { backgroundColor: isDark ? "#2a2a2a" : "#d4f3e3" },
          ]}
        >
          <Text
            style={[styles.tipText, { color: isDark ? "#90ee90" : "#2f6f44" }]}
          >
            🌞 Consejo del día: Deja tus plantas tomar sol por la mañana.
          </Text>
        </View>

        {/* Planta destacada */}
        <View
          style={[
            styles.featuredCard,
            { backgroundColor: isDark ? "#2a3b47" : "#cde9f3" },
          ]}
        >
          <Text
            style={[
              styles.featuredTitle,
              { color: isDark ? "#fff" : "#22577a" },
            ]}
          >
            🌼 Planta destacada
          </Text>
          <Text
            style={[
              styles.featuredDesc,
              { color: isDark ? "#ccc" : "#3a3a3a" },
            ]}
          >
            Lavanda: aromática, resistente, ideal para relajarse.
          </Text>
        </View>

        {/* Botones */}
        <View style={styles.buttonGroup}>
          <MenuButton
            icon="camera"
            label="Escanear Planta"
            onPress={() => navigation.navigate("Camera")}
          />
          <MenuButton
            icon="image"
            label="Desde Galería"
            onPress={handleImagePicker}
          />
          <MenuButton
            icon="leaf"
            label="Mis Plantas"
            onPress={() => navigation.navigate("MyPlants")}
          />
          <MenuButton
            icon="notifications"
            label="Recordatorios"
            onPress={() => navigation.navigate("Reminders")}
          />
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const MenuButton = ({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.menuButton} onPress={onPress} activeOpacity={0.7}>
    <Ionicons name={icon} size={24} color="#fff" />
    <Text style={styles.menuText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    paddingTop: screenWidth * 0.11,
    padding: 24,
    flexGrow: 1,
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    justifyContent: "center",
    width: "100%",
  },
  userGreeting: {
    fontSize: 20,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  appTagline: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    padding: 16,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: "600", marginBottom: 6 },
  weatherText: { fontSize: 16 },
  buttonGroup: { width: "100%", gap: 12 },
  menuButton: {
    flexDirection: "row",
    backgroundColor: "#32a852",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  tipContainer: {
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 16,
    width: "100%",
  },
  tipText: { fontSize: 14, fontStyle: "italic", textAlign: "center" },
  featuredCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  featuredTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  featuredDesc: { fontSize: 14, textAlign: "center" },
});
