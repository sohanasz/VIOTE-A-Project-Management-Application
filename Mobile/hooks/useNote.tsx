import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

type NoteContextType = {
  setNotes: () => Dispatch<SetStateAction<[]>>;
  note: {};
  setNote: () => Dispatch<SetStateAction<[] | null>>;
  noteId: string;
  setNoteId: () => Dispatch<SetStateAction<[] | null>>;
  noteTitle: string;
  setNoteTitle: () => Dispatch<SetStateAction<string>>;
  updateNoteCB: boolean;
  setUpdateNoteCB: () => Dispatch<SetStateAction<boolean>>;
};

const NoteContext = createContext<NoteContextType | undefined>(undefined);

type Note = {
  _id: string;
  title: string;
  content: any[];
  createdBy: {
    username: string;
  };
  createdAt: string;
};

export function NoteProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [note, setNote] = useState<[]>([]);
  const [noteId, setNoteId] = useState<string>("");
  const [noteTitle, setNoteTitle] = useState<string>("");
  const [updateNoteCB, setUpdateNoteCB] = useState<boolean>(false);

  return (
    <NoteContext.Provider
      value={{
        notes,
        setNotes,
        note,
        setNote,
        noteId,
        setNoteId,
        noteTitle,
        setNoteTitle,
        updateNoteCB,
        setUpdateNoteCB,
      }}
    >
      {children}
    </NoteContext.Provider>
  );
}

export function useNote() {
  const context = useContext(NoteContext);
  if (!context) {
    throw new Error("useNote must be used within NoteProvider");
  }
  return context;
}
