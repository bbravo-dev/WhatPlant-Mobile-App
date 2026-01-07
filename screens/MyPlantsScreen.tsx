import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  PanResponder,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../src/lib/supabase";
import { useTheme } from "../src/components/ThemeContext";
import { Swipeable } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function MyPlantsScreen({ route, navigation }: any) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const routePlants = route.params?.plants || [];

  const [weather, setWeather] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [plants, setPlants] = useState<any[]>([]);
  const [newPlant, setNewPlant] = useState("");

  // Estado para modal de imagen
  const [selectedPlant, setSelectedPlant] = useState<any | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  const [weatherIcon, setWeatherIcon] = useState("🌿");

  useEffect(() => {
    fetchWeatherAndSuggest();
    loadUserPlants();
  }, []);

  // PanResponder para cerrar el modal al deslizar hacia abajo
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 15; // Sensibilidad al deslizar
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          setModalVisible(false);
        }
      },
    })
  ).current;

  const loadUserPlants = async () => {
    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user?.id) {
        console.error("Usuario no autenticado:", userError);
        return;
      }
      const userId = userData.user.id;

      const { data, error } = await supabase
        .from("plants")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.error("Error cargando plantas:", error);
        return;
      }

      const mapped = data?.map((p: any) => ({
        id: p.id,
        name: p.name,
        image: p.image_url
          ? { uri: p.image_url }
          : require("../assets/plant.jpg"),
        watering: "Riego recomendado",
        light: "☀️ Personalizar luz",
        created_at: p.created_at,
      }));

      if (routePlants.length > 0) {
        const fromRoute = routePlants.map((p: any, index: number) => ({
          id: mapped.length + index + 1,
          name:
            p.plant_name ||
            p.species?.scientificNameWithoutAuthor ||
            "Planta desconocida",
          image: p.image_url
            ? { uri: p.image_url }
            : require("../assets/plant.jpg"),
          watering: "Riego recomendado",
          light: "☀️ Personalizar luz",
          created_at: new Date().toISOString(),
        }));
        setPlants([...mapped, ...fromRoute]);
      } else {
        setPlants(mapped);
      }
    } catch (error) {
      console.error("Error cargando plantas del usuario:", error);
    }
  };

  const fetchWeatherAndSuggest = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setWeather("No disponible");
        setRecommendation("No se pudo obtener el clima.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const apiKey = "YOUR_API_KEY_HERE";
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=es`;

      const response = await fetch(url);
      const data = await response.json();

      const condition = data.weather?.[0]?.main?.toLowerCase() || "";
      const temp = data.main?.temp;
      const sunrise = data.sys?.sunrise;
      const sunset = data.sys?.sunset;
      const now = Math.floor(Date.now() / 1000);
      const isDay = now >= sunrise && now < sunset;

      const conditionWithTime = isDay
        ? `Día: ${condition} (${temp}°C)`
        : `Noche: ${condition} (${temp}°C)`;

      setWeather(condition && temp ? conditionWithTime : "No disponible");

      if (condition.includes("clear")) {
        setWeatherIcon(isDay ? "☀️" : "🌙");
        setRecommendation(
          isDay
            ? "☀️ Día soleado, ideal para sacar tus plantas al sol."
            : "🌙 Noche despejada, tus plantas pueden descansar bien."
        );
      } else if (condition.includes("rain")) {
        setWeatherIcon("🌧️");
        setRecommendation("🌧️ Está lloviendo, evita regar tus plantas hoy.");
      } else if (condition.includes("cloud")) {
        setWeatherIcon("⛅");
        setRecommendation(
          isDay
            ? "⛅ Día nublado, tus plantas pueden estar en sombra parcial."
            : "☁️ Noche nublada, cuidado con exceso de humedad."
        );
      } else {
        setWeatherIcon("🌿");
        setRecommendation(
          "🌿 Revisa tus plantas manualmente, el clima es variable."
        );
      }
    } catch (error) {
      console.error("Error obteniendo clima:", error);
      setWeather("No disponible");
      setRecommendation("No se pudo obtener el clima.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlantManually = async () => {
    const plantName = newPlant.trim();
    if (!plantName) {
      Alert.alert("Campos incompletos", "Por favor completa los campos.");
      return;
    }
    const exists = plants.some(
      (p) => p.name.toLowerCase() === plantName.toLowerCase()
    );
    if (exists) {
      Alert.alert("Ya existe", "Esta planta ya está en tu lista.");
      return;
    }

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user?.id) {
        console.error("Usuario no autenticado:", userError);
        return;
      }

      const { data, error } = await supabase
        .from("plants")
        .insert([
          {
            name: plantName,
            user_id: userData.user.id,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      setPlants((prev) => [
        ...prev,
        {
          id: data[0].id,
          name: plantName,
          image: require("../assets/plant.jpg"),
          watering: "Riego personalizado",
          light: "🌤️ Personaliza la luz",
          created_at: data[0].created_at,
        },
      ]);
      setNewPlant("");
      Alert.alert("Planta agregada", "La planta se agregó correctamente.");
    } catch (error) {
      console.error("Error agregando planta:", error);
      Alert.alert("Error", "No se pudo agregar la planta");
    }
  };

  const handleImagePress = (plant: any) => {
    setSelectedPlant(plant);
    setModalVisible(true);
  };

  const deletePlant = (plantId: number) => {
    Alert.alert(
      "Eliminar planta",
      "¿Estás seguro de que quieres eliminar esta planta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("plants")
                .delete()
                .eq("id", plantId);

              if (error) throw error;

              setPlants((prev) => prev.filter((p) => p.id !== plantId));
              Alert.alert("✅ Eliminado", "La planta fue borrada.");
            } catch (err) {
              console.error("Error eliminando planta:", err);
              Alert.alert("❌ Error", "No se pudo eliminar la planta");
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (plantId: number) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => deletePlant(plantId)}
    >
      <Ionicons name="trash" size={24} color="white" />
    </TouchableOpacity>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: isDark ? "#121212" : "#f5fff8" },
        ]}
      >
        <LinearGradient
          colors={isDark ? ["#1e1e1e", "#121212"] : ["#dfffea", "#c3f2db"]}
          style={styles.climateBox}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#00cc88" />
          ) : (
            <>
              <Text style={[styles.weatherIcon]}>{weatherIcon}</Text>
              <Text
                style={[
                  styles.weatherText,
                  { color: isDark ? "#fff" : "#2e7d32" },
                ]}
              >
                {weather}
              </Text>
              <Text
                style={[
                  styles.recommendation,
                  { color: isDark ? "#ccc" : "#555" },
                ]}
              >
                {recommendation}
              </Text>
            </>
          )}
        </LinearGradient>

        {plants.map((plant) => (
          <Swipeable
            key={plant.id}
            renderRightActions={() => renderRightActions(plant.id)}
          >
            <TouchableOpacity onPress={() => handleImagePress(plant)}>
              <View
                style={[
                  styles.plantCard,
                  { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
                ]}
              >
                <Image source={plant.image} style={styles.plantImage} />
                <View style={styles.plantInfo}>
                  <Text
                    style={[
                      styles.plantName,
                      { color: isDark ? "#fff" : "#000" },
                    ]}
                  >
                    {plant.name}
                  </Text>
                  <Text
                    style={[
                      styles.waterInfo,
                      { color: isDark ? "#bbb" : "#4f4f4f" },
                    ]}
                  >
                    💧 {plant.watering}
                  </Text>
                  <Text
                    style={[
                      styles.lightInfo,
                      { color: isDark ? "#aaa" : "#6a6a6a" },
                    ]}
                  >
                    {plant.light}
                  </Text>
                  <Text
                    style={[
                      styles.dateText,
                      { color: isDark ? "#888" : "#999" },
                    ]}
                  >
                    📅 {formatDate(plant.created_at)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Swipeable>
        ))}

        <View
          style={[
            styles.form,
            { backgroundColor: isDark ? "#1e1e1e" : "#ffffff" },
          ]}
        >
          <Text
            style={[styles.formTitle, { color: isDark ? "#fff" : "#1b5e20" }]}
          >
            ➕ Nueva Planta
          </Text>
          <TextInput
            placeholder="Nombre de planta (ej: Lavanda)"
            placeholderTextColor={isDark ? "#888" : "#999"}
            value={newPlant}
            onChangeText={setNewPlant}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#2a2a2a" : "#fff",
                color: isDark ? "#fff" : "#000",
                borderColor: isDark ? "#444" : "#ccc",
              },
            ]}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddPlantManually}
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.addButtonText}>Agregar planta manualmente</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal fullscreen con swipe hacia abajo */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.fullscreenOverlay} {...panResponder.panHandlers}>
          <Image
            source={selectedPlant?.image}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
          <View style={styles.captionContainer}>
            <Text style={styles.modalText}>{selectedPlant?.name}</Text>
            <Text style={styles.modalDate}>
              📅 {selectedPlant && formatDate(selectedPlant.created_at)}
            </Text>
            <Text style={styles.modalHint}>⬇️ Desliza hacia abajo para cerrar</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  climateBox: {
    padding: 20,
    borderRadius: 14,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  weatherIcon: {
    fontSize: 40,
    marginBottom: 6,
  },
  weatherText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  recommendation: {
    marginTop: 6,
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  plantCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  plantImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 14,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  waterInfo: {
    fontSize: 14,
  },
  lightInfo: {
    fontSize: 14,
    fontStyle: "italic",
  },
  dateText: {
    fontSize: 12,
    marginTop: 4,
  },
  form: {
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#32a852",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
  // Swipe eliminar
  deleteButton: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    borderRadius: 12,
    marginBottom: 16,
  },
  // Modal fullscreen estilos
  fullscreenOverlay: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: "rgba(4, 4, 5, 1)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: width,
    height: height,
    position: "absolute",
  },
  captionContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 15,
    borderRadius: 10,
  },
  modalText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
    textAlign: "center",
  },
  modalDate: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
  },
  modalHint: {
    marginTop: 10,
    color: "#aaa",
    textAlign: "center",
    fontStyle: "italic",
  },
});