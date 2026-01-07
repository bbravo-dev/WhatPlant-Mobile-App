import "react-native-get-random-values";
import { decode as base64Decode } from "base64-arraybuffer";
import { v4 as uuidv4 } from "uuid";
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  Platform,
  Modal,
  PanResponder,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { supabase } from "../src/lib/supabase";
import { useTheme } from "../src/components/ThemeContext";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function ResultScreen({ route, navigation }: any) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const styles = useMemo(() => makeStyles(isDark), [isDark]);
  const [saving, setSaving] = useState(false);

  const initialResult = route.params?.result || null;
  const imageUriFromParams = route.params?.imageUrl || route.params?.uri || null;
  const base64FromParams: string | null = route.params?.base64Image
    ? route.params.base64Image
    : route.params?.base64
    ? `data:image/jpeg;base64,${route.params.base64}`
    : null;

  const [result, setResult] = useState<any>(initialResult);
  const [loadingApi, setLoadingApi] = useState<boolean>(false);
  const [wikiInfo, setWikiInfo] = useState<string | null>(null);
  const [wikiFetched, setWikiFetched] = useState<boolean>(false);
  const [loadingWiki, setLoadingWiki] = useState<boolean>(true);
  const [relatedPlants, setRelatedPlants] = useState<any[]>([]);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

  // Modal de imagen
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedPlantName, setSelectedPlantName] = useState<string>("");

  // PanResponder para cerrar el modal al deslizar hacia abajo
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 15;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          closeImageModal();
        }
      },
    })
  ).current;

  const suggestion = result?.results?.[0] || result?.suggestions?.[0];
  const species = suggestion?.species || {};
  const plant = suggestion?.plant_details || {};
  const speciesName =
    species?.scientificNameWithoutAuthor || suggestion?.plant_name;
  const genusName = species?.genus?.scientificNameWithoutAuthor;
  const mainConfidence = suggestion?.score || suggestion?.probability || 0;
  const mainConfidencePercent =
    mainConfidence < 0.001 ? "<0.1" : (mainConfidence * 100).toFixed(1);

  const getConfidenceLevel = (percent: string) => {
    const numValue = percent === "<0.1" ? 0 : parseFloat(percent);
    if (numValue >= 60) return "Alta";
    if (numValue >= 30) return "Media";
    if (numValue >= 10) return "Baja";
    return "Muy baja";
  };

  const openImageModal = (imageUrl: string, plantName: string) => {
    setSelectedImage(imageUrl);
    setSelectedPlantName(plantName);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
    setSelectedPlantName("");
  };

  // Identificación desde galería
  useEffect(() => {
    const identifyFromGallery = async () => {
      if (result || !imageUriFromParams) return;

      try {
        setLoadingApi(true);
        const apiKey = "YOUR_API_KEY_HERE";
        const project = "all";

        const formData = new FormData();
        formData.append("images", {
          uri:
            Platform.OS === "ios"
              ? imageUriFromParams.replace("file://", "")
              : imageUriFromParams,
          name: "photo.jpg",
          type: "image/jpeg",
        } as any);
        formData.append("organs", "auto");

        const response = await fetch(
          `https://my-api.plantnet.org/v2/identify/${project}?api-key=${apiKey}&include-related-images=true`,
          { method: "POST", body: formData, headers: { Accept: "application/json" } }
        );

        const data = await response.json();
        if (!response.ok) {
          console.error("❌ Error PlantNet:", data);
          Alert.alert(
            "Error",
            data?.message || "No se pudo identificar la planta."
          );
          return;
        }

        setResult(data);
      } catch (error: any) {
        console.error("🔥 Error identificando (galería):", error);
        Alert.alert(
          "Error",
          error?.message || "No se pudo conectar con PlantNet."
        );
      } finally {
        setLoadingApi(false);
      }
    };

    identifyFromGallery();
  }, [imageUriFromParams, result]);

  // Wikipedia
  useEffect(() => {
    if (!speciesName || wikiFetched) return;

    const fetchWikipediaInfo = async () => {
      setLoadingWiki(true);
      try {
        const cleanSpeciesName = speciesName
          .replace(/[\.,]/g, "")
          .replace(/\s+[A-Z]{1,2}$/, "")
          .split(" ")
          .slice(0, 2)
          .join(" ");

        const queryTitle =
          plant?.common_names?.[0] || cleanSpeciesName || speciesName;

        const headers = {
          "User-Agent": "MiAplicacionBot/1.0 (contacto@miemail.com)",
          Accept: "application/json",
        };

        const searchUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          queryTitle
        )}&utf8=&format=json&origin=*`;

        const searchResponse = await fetch(searchUrl, { headers });
        const searchData = await searchResponse.json();

        if (!searchData?.query?.search?.length) {
          setWikiInfo(null);
          setWikiFetched(true);
          return;
        }

        const pageId = searchData.query.search[0].pageid;
        const contentUrl = `https://es.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&pageids=${pageId}&format=json&origin=*`;
        const contentResponse = await fetch(contentUrl, { headers });
        const contentData = await contentResponse.json();
        const page = contentData.query.pages[pageId];

        setWikiInfo(page.extract || null);
        setWikiFetched(true);
      } catch (error) {
        console.error("Error Wikipedia:", error);
        setWikiInfo(null);
        setWikiFetched(true);
      } finally {
        setLoadingWiki(false);
      }
    };

    fetchWikipediaInfo();
  }, [speciesName, plant, wikiFetched]);

  // Plantas relacionadas
  useEffect(() => {
    if (!genusName || !result?.results) return;

    const currentSuggestionScientificName =
      suggestion?.species?.scientificNameWithoutAuthor;

    const related = result.results
      .filter((r: any, index: number) => {
        if (!r.images || r.images.length === 0) return false;
        const isSameGenus =
          r.species?.genus?.scientificNameWithoutAuthor === genusName;
        const isNotCurrent = currentSuggestionScientificName
          ? r.species?.scientificNameWithoutAuthor !==
            currentSuggestionScientificName
          : index !== 0;
        return isSameGenus && isNotCurrent;
      })
      .map((r: any) => {
        let img = "";
        if (r.images && r.images.length > 0) {
          const bestImage = r.images[0];
          img =
            bestImage.url?.m ||
            bestImage.url?.o ||
            bestImage.url?.s ||
            bestImage.url ||
            "";
          if (img.startsWith("//")) img = "https:" + img;
          else if (img.startsWith("/")) img = "https://plantnet.org" + img;
        }

        const prob = r.score || r.probability || 0;
        let probPercent: string =
          prob * 100 < 0.1 ? "<0.1" : (prob * 100).toFixed(1);

        return {
          id:
            r.species?.scientificNameWithoutAuthor ||
            Math.random().toString(),
          name:
            r.species?.scientificNameWithoutAuthor || "Nombre desconocido",
          probability: prob,
          probabilityPercent: probPercent,
          imageUrl: img,
        };
      });

    const sortedByProbability = related.sort(
      (a: any, b: any) => b.probability - a.probability
    );
    setRelatedPlants(sortedByProbability.slice(0, 5));
  }, [result, genusName, suggestion]);

  const handleImageError = (imageUrl: string) => {
    setImageErrors((prev) => ({ ...prev, [imageUrl]: true }));
  };

  const handleSavePlant = async () => {
    const commonName =
      plant?.common_names?.[0] ||
      species?.scientificName ||
      "Planta desconocida";

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user?.id) {
        Alert.alert("Error", "No se pudo obtener el usuario logueado.");
        setSaving(false);
        return;
      }
      const userId = user.id;

      if (!base64FromParams) {
        Alert.alert("Error", "No se encontró la imagen de la planta.");
        setSaving(false);
        return;
      }

      const cleanedBase64 = base64FromParams.replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      const arrayBuffer = base64Decode(cleanedBase64);
      const fileName = `user_${userId}/${uuidv4()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("plants")
        .upload(fileName, arrayBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("plants")
        .getPublicUrl(fileName);
      const publicImageUrl = urlData.publicUrl;

      const { error: insertError } = await supabase
        .from("plants")
        .insert([
          {
            user_id: userId,
            name: commonName,
            description: wikiInfo || "Sin descripción",
            image_url: publicImageUrl,
          },
        ]);

      if (insertError) throw insertError;

      Alert.alert("✅ Guardado", "Tu planta ha sido guardada exitosamente.");
      navigation.navigate("MyPlants");
    } catch (error: any) {
      console.error("🔥 Error guardando planta:", error);
      Alert.alert("Error", error?.message || "No se pudo guardar la planta.");
    } finally {
      setSaving(false);
    }
  };

  if (!result && !loadingApi) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons
          name="restart-alert"
          size={48}
          color={isDark ? "#7EE0B6" : "#00cc88"}
          style={{ alignSelf: "center", marginBottom: 10 }}
        />
        <Text style={styles.title}>¡Resultado reseteado!</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          style={{ marginTop: 20 }}
        >
          <Text style={styles.link}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loadingApi || !result) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          size="large"
          color={isDark ? "#7EE0B6" : "#00cc88"}
        />
        <Text style={styles.text}>Analizando la planta...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        {imageUriFromParams && (
          <Image
            source={{ uri: imageUriFromParams }}
            style={styles.mainImage}
          />
        )}

        <Text style={styles.resultTitle}>🌱 Resultado Obtenido</Text>

        <View style={styles.card}>
          <Text style={styles.title}>
            {plant?.common_names?.[0] ||
              species?.scientificName ||
              "Planta desconocida"}
          </Text>
          <Text style={styles.label}>Nombre científico:</Text>
          <Text style={styles.value}>{speciesName || "No disponible"}</Text>
          <Text style={styles.label}>Autor:</Text>
          <Text style={styles.value}>
            {plant?.name_authority || "No disponible"}
          </Text>
          <Text style={styles.label}>Nivel de confianza:</Text>
          <Text style={styles.value}>
            {mainConfidencePercent === "<0.1"
              ? "<0.1%"
              : `${mainConfidencePercent}%`}{" "}
            ({getConfidenceLevel(mainConfidencePercent)})
          </Text>
          <Text style={styles.label}>Descripción general:</Text>
          {loadingWiki ? (
            <ActivityIndicator
              size="small"
              color={isDark ? "#7EE0B6" : "#00cc88"}
            />
          ) : (
            <Text style={styles.description}>
              {wikiInfo ||
                "No se encontró información adicional en Wikipedia."}
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🌿 Plantas relacionadas</Text>
          {relatedPlants.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {relatedPlants.map((p, index) => (
                <TouchableOpacity
                  key={p.id || index}
                  style={styles.relatedCard}
                  onPress={() =>
                    p.imageUrl && openImageModal(p.imageUrl, p.name)
                  }
                >
                  {p.imageUrl && !imageErrors[p.imageUrl] ? (
                    <Image
                      source={{ uri: p.imageUrl }}
                      style={styles.relatedPlantImage}
                      onError={() => handleImageError(p.imageUrl)}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="leaf"
                      size={40}
                      color={isDark ? "#7EE0B6" : "#00cc88"}
                    />
                  )}
                  <Text style={styles.relatedName}>{p.name}</Text>
                  <Text style={styles.value}>
                    Confianza:{" "}
                    {p.probabilityPercent === "<0.1"
                      ? "<0.1%"
                      : `${p.probabilityPercent}%`}{" "}
                    ({getConfidenceLevel(p.probabilityPercent)})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.text}>
              No se encontraron plantas relacionadas.
            </Text>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.disabledButton]} 
          onPress={handleSavePlant}
          disabled={saving}
        >
          {saving ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.buttonText}>Guardando planta...</Text>
            </>
          ) : (
            <>
              <Entypo name="save" size={24} color="white" />
              <Text style={styles.buttonText}>Guardar planta en mi jardín</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Entypo name="home" size={24} color="white" />
          <Text style={styles.buttonText}>Home</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal fullscreen con swipe hacia abajo */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeImageModal}
      >
        <View style={styles.fullscreenOverlay} {...panResponder.panHandlers}>
          <Image
            source={{ uri: selectedImage || "" }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
          <View style={styles.captionContainer}>
            <Text style={styles.modalText}>{selectedPlantName}</Text>
            <Text style={styles.modalHint}>⬇️ Desliza hacia abajo para cerrar</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------- Styles ----------
const makeStyles = (isDark: boolean) =>
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: isDark ? "#0B0F0E" : "#fff",
    },
    container: {
      paddingTop: screenWidth * 0.11,
      paddingHorizontal: 20,
      paddingBottom: 60,
      backgroundColor: isDark ? "#0B0F0E" : "#fff",
      gap: 20,
      flexGrow: 1,
      justifyContent: "center",
    },
    mainImage: {
      width: 220,
      height: 220,
      borderRadius: 12,
      alignSelf: "center",
      marginBottom: 10,
    },
    card: {
      backgroundColor: isDark ? "#121917" : "#f9f9f9",
      borderRadius: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.35 : 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    title: {
      fontSize: 22,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 10,
      color: isDark ? "#EAF7F1" : "#333",
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      textAlign: "center",
      marginBottom: 10,
      color: isDark ? "#EAF7F1" : "#222",
    },
    resultTitle: {
      fontSize: 26,
      fontWeight: "600",
      textAlign: "center",
      marginBottom: 10,
      color: isDark ? "#EAF7F1" : "#222",
    },
    label: {
      fontWeight: "600",
      fontSize: 16,
      marginTop: 10,
      color: isDark ? "#CDEADF" : "#111",
    },
    value: {
      fontSize: 15,
      color: isDark ? "#B5D7CC" : "#444",
    },
    description: {
      fontStyle: "italic",
      color: isDark ? "#ADCEC3" : "#555",
      marginTop: 6,
    },
    relatedCard: {
      backgroundColor: isDark ? "#0F1513" : "#e7f6f0",
      padding: 12,
      borderRadius: 10,
      marginRight: 10,
      alignItems: "center",
      width: 140,
    },
    relatedPlantImage: {
      width: 100,
      height: 100,
      borderRadius: 8,
      marginBottom: 5,
    },
    relatedName: {
      fontWeight: "bold",
      fontSize: 14,
      color: isDark ? "#EAF7F1" : "#333",
      textAlign: "center",
    },
    text: {
      color: isDark ? "#CDEADF" : "#555",
      fontSize: 15,
      textAlign: "center",
    },
    saveButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#00cc88",
      paddingVertical: 14,
      borderRadius: 10,
      marginTop: 10,
    },
    disabledButton: {
      backgroundColor: "#99e6c9",
    },
    homeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#00cc88",
      paddingVertical: 14,
      borderRadius: 10,
      marginTop: 10,
    },
    buttonText: {
      color: "white",
      fontSize: 16,
      marginLeft: 10,
      fontWeight: "500",
    },
    link: {
      color: "#00cc88",
      textAlign: "center",
      fontSize: 16,
      fontWeight: "500",
    },
    // Modal fullscreen estilos
    fullscreenOverlay: {
      flex: 1,
      width: screenWidth,
      height: screenHeight,
      backgroundColor: "black",
      justifyContent: "center",
      alignItems: "center",
    },
    fullscreenImage: {
      width: screenWidth,
      height: screenHeight,
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
    modalHint: {
      marginTop: 10,
      color: "#aaa",
      textAlign: "center",
      fontStyle: "italic",
    },
  });