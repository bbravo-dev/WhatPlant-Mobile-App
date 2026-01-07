// screens/RemindersScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../src/lib/supabase";
import { useTheme } from "../src/components/ThemeContext";
import { Swipeable } from "react-native-gesture-handler";

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [newDay, setNewDay] = useState("");
  const [newTask, setNewTask] = useState("");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const loadReminders = async () => {
      try {
        const data = await fetchReminders();
        setReminders(data);
      } catch (err) {
        console.error("Error cargando recordatorios:", err);
      }
    };
    loadReminders();
  }, []);

  const fetchReminders = async () => {
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const addReminder = async (day: string, task: string) => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("reminders")
      .insert([
        {
          user_id: user.data.user?.id,
          day,
          task,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteReminder = (id: string) => {
    Alert.alert(
      "Eliminar recordatorio",
      "¿Quieres eliminar este recordatorio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("reminders")
                .delete()
                .eq("id", id);

              if (error) throw error;

              setReminders((prev) => prev.filter((r) => r.id !== id));
              Alert.alert("✅ Eliminado", "El recordatorio fue borrado.");
            } catch (err) {
              console.error("Error eliminando recordatorio:", err);
              Alert.alert("❌ Error", "No se pudo eliminar el recordatorio");
            }
          },
        },
      ]
    );
  };

  const handleAddNewReminder = async () => {
    if (!newDay.trim() || !newTask.trim()) {
      Alert.alert("Campos incompletos", "Completa el día y la tarea.");
      return;
    }

    const validDays = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Miercoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Sabado",
      "Domingo",
    ];

    if (!validDays.includes(newDay.trim())) {
      Alert.alert(
        "Día inválido",
        "Por favor ingresa un día válido (ej: Lunes, Martes...)."
      );
      return;
    }

    try {
      const newReminder = await addReminder(newDay.trim(), newTask.trim());
      setReminders((prev) => [newReminder, ...prev]);
      setNewDay("");
      setNewTask("");
      Alert.alert("✅ Recordatorio agregado");
    } catch (err) {
      console.error("Error insertando recordatorio:", err);
      Alert.alert("❌ Error", "No se pudo agregar el recordatorio");
    }
  };

  const renderRightActions = (id: string) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => deleteReminder(id)}
    >
      <Ionicons name="trash" size={24} color="white" />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#f5fff8" },
      ]}
    >
      <Text style={[styles.title, { color: isDark ? "#90ee90" : "#228B22" }]}>
        🔔 Recordatorios Semanales
      </Text>

      {reminders.map((reminder) => (
        <Swipeable
          key={reminder.id}
          renderRightActions={() => renderRightActions(reminder.id)}
        >
          <View
            style={[
              styles.reminderBox,
              { backgroundColor: isDark ? "#1e1e1e" : "#e6f4ea" },
            ]}
          >
            <Text
              style={[styles.day, { color: isDark ? "#b0e57c" : "#2e7d32" }]}
            >
              {reminder.day}
            </Text>
            <Text style={[styles.task, { color: isDark ? "#ddd" : "#555" }]}>
              • {reminder.task}
            </Text>
          </View>
        </Swipeable>
      ))}

      <View
        style={[styles.form, { backgroundColor: isDark ? "#222" : "#e3f7ed" }]}
      >
        <Text style={[styles.formTitle, { color: isDark ? "#fff" : "#1b5e20" }]}>
          ➕ Nuevo recordatorio
        </Text>
        <TextInput
          placeholder="Día (ej: Lunes)"
          placeholderTextColor={isDark ? "#aaa" : "#666"}
          value={newDay}
          onChangeText={setNewDay}
          style={[
            styles.input,
            {
              backgroundColor: isDark ? "#333" : "#fff",
              color: isDark ? "#fff" : "#000",
              borderColor: isDark ? "#555" : "#ccc",
            },
          ]}
        />
        <TextInput
          placeholder="Tarea (ej: Regar Plantas)"
          placeholderTextColor={isDark ? "#aaa" : "#666"}
          value={newTask}
          onChangeText={setNewTask}
          style={[
            styles.input,
            {
              backgroundColor: isDark ? "#333" : "#fff",
              color: isDark ? "#fff" : "#000",
              borderColor: isDark ? "#555" : "#ccc",
            },
          ]}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddNewReminder}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.addButtonText}>Agregar recordatorio</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  reminderBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  day: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  task: {
    fontSize: 15,
    lineHeight: 20,
  },
  form: {
    padding: 16,
    borderRadius: 12,
    marginTop: 25,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    fontSize: 15,
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#32a852",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    width: 75,
    borderRadius: 10,
    marginBottom: 14,
  },
});
