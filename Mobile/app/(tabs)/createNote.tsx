import { Platform } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import useTheme from "@/hooks/useTheme";
import useProject from "@/hooks/useProject";
import { api } from "@/lib/api";
import { useNote } from "@/hooks/useNote";
import TextEditor from "@/components/TextEditor";
import { showAlert } from "@/lib/showAlert";

const PROJECT_ID_SESSION_KEY = "ACTIVE_PROJECT_ID";

const CreateNote = () => {
  const { colors } = useTheme();
  const { project } = useProject();
  const { note, setNote, noteTitle, setNoteTitle, updateNoteCB, noteId } =
    useNote();

  // 🔹 Local projectId state (decoupled from project document)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  /* -----------------------------------------
     Sync project._id → local state + storage
  ------------------------------------------ */
  useEffect(() => {
    if (!project?._id) return;

    setActiveProjectId(project._id);

    if (Platform.OS === "web") {
      sessionStorage.setItem(PROJECT_ID_SESSION_KEY, project._id);
    }
  }, [project?._id]);

  /* -----------------------------------------
     Restore projectId on reload (WEB ONLY)
  ------------------------------------------ */
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (activeProjectId) return;

    const cachedId = sessionStorage.getItem(PROJECT_ID_SESSION_KEY);
    if (cachedId) {
      setActiveProjectId(cachedId);
    }
  }, []);

  /* -----------------------------------------
     Save new note
  ------------------------------------------ */
  const handleSave = async (): Promise<void> => {
    if (!activeProjectId) {
      showAlert("Notes not saved", "Please select a project before saving.");
      return;
    }

    try {
      await api.post(`/projects/${activeProjectId}/notes`, {
        title: noteTitle,
        content: note,
      });

      showAlert("Success", "Notes saved successfully");

      if (Platform.OS === "web") {
        sessionStorage.removeItem(PROJECT_ID_SESSION_KEY);
      }

      router.back();
    } catch (err) {
      console.error("Failed to save note", err);
      showAlert("Error", "Failed to save notes.");
    }
  };

  /* -----------------------------------------
     Update existing note
  ------------------------------------------ */
  const handleUpdate = async (): Promise<void> => {
    if (!activeProjectId) {
      showAlert("Notes not updated", "Please select a project before saving.");
      return;
    }

    try {
      const res = await api.put(
        `/projects/${activeProjectId}/notes/${noteId}`,
        {
          title: noteTitle,
          content: note,
        }
      );

      if (res.status === 200) {
        showAlert("Success", "Notes updated successfully");

        if (Platform.OS === "web") {
          sessionStorage.removeItem(PROJECT_ID_SESSION_KEY);
        }

        router.back();
      }
    } catch (err) {
      console.error("Failed to update note", err);
      showAlert("Error", "Notes did not update.");
    }
  };

  return (
    <TextEditor
      onSave={updateNoteCB ? handleUpdate : handleSave}
      notesTitle={noteTitle}
      setNotesTitle={setNoteTitle}
      notes={note}
      setNotes={setNote}
      colors={colors}
    />
  );
};

export default CreateNote;
