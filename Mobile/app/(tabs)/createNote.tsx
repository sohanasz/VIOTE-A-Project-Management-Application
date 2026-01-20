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
const NOTE_ID_SESSION_KEY = "ACTIVE_NOTE_ID";
const NOTE_MODE_SESSION_KEY = "NOTE_EDIT_MODE";

const CreateNote = () => {
  const { colors } = useTheme();
  const { project } = useProject();
  const { note, setNote, noteTitle, setNoteTitle, updateNoteCB, noteId } =
    useNote();

  /* -----------------------------------------
     Local persisted identifiers (web-safe)
  ------------------------------------------ */
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

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
     Sync noteId, updateNoteCB → local state + storage
     (only when updating)
  ------------------------------------------ */
  useEffect(() => {
    if (updateNoteCB !== true) return;
    if (!noteId) return;

    setActiveNoteId(noteId);
    setIsEditMode(true);

    if (Platform.OS === "web") {
      sessionStorage.setItem(NOTE_ID_SESSION_KEY, noteId);
      sessionStorage.setItem(NOTE_MODE_SESSION_KEY, "true");
    }
  }, [updateNoteCB, noteId]);

  /* -----------------------------------------
     Restore identifiers on reload (WEB ONLY)
  ------------------------------------------ */
  useEffect(() => {
    if (Platform.OS !== "web") return;

    if (!activeProjectId) {
      const cachedProjectId = sessionStorage.getItem(PROJECT_ID_SESSION_KEY);
      if (cachedProjectId) {
        setActiveProjectId(cachedProjectId);
      }
    }

    // Restore edit mode flag
    const cachedEditMode = sessionStorage.getItem(NOTE_MODE_SESSION_KEY);
    if (cachedEditMode === "true") {
      setIsEditMode(true);

      // Also restore the note ID
      const cachedNoteId = sessionStorage.getItem(NOTE_ID_SESSION_KEY);
      if (cachedNoteId) {
        setActiveNoteId(cachedNoteId);
      }
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
        sessionStorage.removeItem(NOTE_ID_SESSION_KEY);
        sessionStorage.removeItem(NOTE_MODE_SESSION_KEY);
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
    if (!activeProjectId || !activeNoteId) {
      showAlert(
        "Notes not updated",
        "Required identifiers are missing. Please reopen the note.",
      );
      return;
    }

    try {
      const res = await api.put(
        `/projects/${activeProjectId}/notes/${activeNoteId}`,
        {
          title: noteTitle,
          content: note,
        },
      );

      if (res.status === 200) {
        showAlert("Success", "Notes updated successfully");

        if (Platform.OS === "web") {
          sessionStorage.removeItem(PROJECT_ID_SESSION_KEY);
          sessionStorage.removeItem(NOTE_ID_SESSION_KEY);
          sessionStorage.removeItem(NOTE_MODE_SESSION_KEY);
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
      onSave={isEditMode ? handleUpdate : handleSave}
      notesTitle={noteTitle}
      setNotesTitle={setNoteTitle}
      notes={note}
      setNotes={setNote}
      colors={colors}
    />
  );
};

export default CreateNote;
