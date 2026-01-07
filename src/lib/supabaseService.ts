import { supabase } from "./supabase";

export async function fetchReminders() {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function addReminder(day: string, task: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from("reminders")
    .insert([{ user_id: userId, day, task }])
    .select();

  if (error) throw error;
  return data[0];
}

export async function deleteReminder(id: string) {
  const { error } = await supabase.from("reminders").delete().eq("id", id);
  if (error) throw error;
}
