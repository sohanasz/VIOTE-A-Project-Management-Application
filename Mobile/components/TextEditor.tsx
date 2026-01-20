import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  KeyboardAvoidingView,
  TextInput,
  FlatList,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";

import { useState, useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import {
  createCreateNoteStyles,
  determineBlockStyle,
} from "@/assets/styles/createNote";
import {
  BulletList,
  BulletPoint,
  Heading,
  Paragraph,
} from "@/lib/classes/Block";
import { ColorScheme } from "@/hooks/useTheme";
import { router } from "expo-router";

const SESSION_KEY = "TEXT_EDITOR_DRAFT";

interface Block {
  id: number;
  blockType: "heading" | "paragraph" | "bulletList" | "numericList";
  text: string | BulletPoint[];
  textInputHeight: number;
  currentBulletPointId?: number | null;
  isFocused?: boolean;
  meta?: Record<string, unknown>;
}

interface TextEditorProps {
  notesTitle: string;
  setNotesTitle: (title: string) => void;
  notes: Block[];
  setNotes: (notes: Block[] | ((prev: Block[]) => Block[])) => void;
  colors: ColorScheme;
  onSave: () => Promise<void>;
  setOnSaveError?: (error: unknown) => void;
}

interface EditorDraft {
  notesTitle: string;
  notes: Block[];
}

interface RenderBlockProps {
  item: Block;
}

const TextEditor = ({
  notesTitle,
  setNotesTitle,
  notes,
  setNotes,
  colors,
  onSave,
  setOnSaveError,
}: TextEditorProps) => {
  const styles = createCreateNoteStyles(colors);
  const fetchCacheRef = useRef<boolean>(true);

  const [currentBlockCreationType, setCurrentBlockCreationType] = useState<
    "heading" | "paragraph" | "bulletList" | "numericList"
  >("heading");
  const [blockId, setBlockId] = useState<number>(0);
  const [currentBlockToEdit, setCurrentBlockToEdit] = useState<
    Block | Record<string, never>
  >({});
  const [currentInputText, setCurrentInputText] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [documentUpdateRender, setDocumentUpdateRender] = useState<number>(0);

  useEffect(() => {
    if (notes && notes.length > 0) {
      const lastId = notes[notes.length - 1].id;
      setBlockId(lastId);
    }
  }, [notes]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!fetchCacheRef.current) return;
    fetchCacheRef.current = false;

    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;

      const parsed: unknown = JSON.parse(raw);

      if (parsed && typeof parsed === "object" && "notes" in parsed) {
        const parsedDraft = parsed as EditorDraft;
        if (Array.isArray(parsedDraft.notes)) {
          setNotes(parsedDraft.notes);
        }
      }

      if (
        parsed &&
        typeof parsed === "object" &&
        "notesTitle" in parsed &&
        typeof parsed.notesTitle === "string"
      ) {
        setNotesTitle(parsed.notesTitle);
      }
    } catch (e) {
      console.warn("Failed to restore editor draft", e);
    }
  }, [setNotes, setNotesTitle]);

  useEffect(() => {
    console.log("HEllo There");

    if (Platform.OS !== "web") return;
    console.log("HEllo There 1", fetchCacheRef.current);
    if (fetchCacheRef.current) return;
    console.log("HEllo There 2");

    const payload: EditorDraft = {
      notesTitle,
      notes: Array.isArray(notes) ? notes : [],
    };
    console.log("HEllo There 3", notes);

    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to save editor draft", e);
    }
  }, [notesTitle, notes, documentUpdateRender]);

  const getBlockTypeText = (
    type: "heading" | "paragraph" | "bulletList" | "numericList",
  ): string => {
    switch (type) {
      case "heading":
        return "Heading";
      case "paragraph":
        return "Paragraph";
      case "bulletList":
        return "Bullet List";
      case "numericList":
        return "Numeric List";
      default:
        return "Select Type";
    }
  };

  const createBlock = (): void => {
    let block: Heading | Paragraph | BulletList;

    switch (currentBlockCreationType) {
      case "heading":
        block = new Heading();
        break;
      case "paragraph":
        block = new Paragraph();
        break;
      case "bulletList":
        block = new BulletList();
        break;
      case "numericList":
        block = new BulletList().upgradeToNumeric();
        break;
      default:
        block = new Paragraph();
    }

    block.id = blockId + 1;
    setBlockId(blockId + 1);

    setNotes((prevNotes: Block[]): Block[] => {
      return [...prevNotes, block as unknown as Block];
    });
  };

  const renderBulletList = (item: Block): JSX.Element[] => {
    if (!Array.isArray(item.text)) {
      return [];
    }

    const style = determineBlockStyle(item.blockType, colors);
    return item.text.map((bulletPoint: BulletPoint) => {
      return (
        <Pressable
          key={bulletPoint.id}
          style={{
            flexDirection: "row",
          }}
          onPress={() => {
            item.currentBulletPointId = bulletPoint.id;
            setCurrentBlockToEdit(item);
            setCurrentInputText(bulletPoint.text);
            setDocumentUpdateRender((count) => count + 1);
          }}
        >
          <Text style={style}>
            {item.blockType === "numericList"
              ? `  ${bulletPoint.id}. `
              : `  ${BulletList.preString}  `}
          </Text>

          {item.currentBulletPointId === bulletPoint.id &&
          currentBlockToEdit === item ? (
            <TextInput
              style={[
                style,
                {
                  borderColor: "gray",
                  borderWidth: 2,
                  borderRadius: 16,
                  overflow: "hidden",
                  flex: 1,
                  padding: 10,
                },
              ]}
              value={currentInputText}
              textAlignVertical="top"
              multiline={true}
              placeholder="Enter Something"
              onChangeText={(text: string) => {
                if (!text.includes("\n")) {
                  bulletPoint.text = text;
                  setCurrentInputText(text);
                  return;
                }

                if (text.includes("\n")) {
                  if (
                    bulletPoint.text === text.replace("\n", "") &&
                    item.currentBulletPointId !== bulletPoint.id
                  ) {
                    return;
                  }

                  const parsingNextLineText = text.replace("\n", "");

                  bulletPoint.text = parsingNextLineText;
                  let currentArray = item.text as BulletPoint[];
                  const newArray: BulletPoint[] = [];
                  const bulletPointToInsert = new BulletPoint(null, "");
                  let trackId: boolean | number = false;

                  for (let index = 0; index < currentArray.length; index++) {
                    newArray.push(currentArray[index]);
                    if (currentArray[index] === bulletPoint) {
                      const newId = currentArray[index].id! + 1;
                      bulletPointToInsert.id = newId;
                      newArray.push(bulletPointToInsert);
                      trackId = newId;
                    } else if (typeof trackId === "number") {
                      currentArray[index].id = ++trackId;
                    }
                  }
                  item.text = newArray;
                  item.currentBulletPointId = bulletPointToInsert.id;
                  setCurrentInputText(bulletPointToInsert.text);

                  setDocumentUpdateRender((documentUpdateRender) => {
                    return documentUpdateRender + 1;
                  });
                }
              }}
              onKeyPress={(event) => {
                if (
                  event.nativeEvent.key === "Backspace" &&
                  bulletPoint.text === ""
                ) {
                  let currentArray = item.text as BulletPoint[];
                  const newArray: BulletPoint[] = [];
                  let removed = false;
                  let previousBullet: BulletPoint | null = null;
                  let trackId = 1;

                  for (let index = 0; index < currentArray.length; index++) {
                    const current = currentArray[index];

                    if (current === bulletPoint) {
                      removed = true;
                      continue;
                    }

                    current.id = trackId++;
                    newArray.push(current);

                    if (!removed) {
                      previousBullet = current;
                    }
                  }

                  if (newArray.length === 0) return;

                  item.text = newArray;

                  const targetBullet = previousBullet ?? newArray[0];
                  item.currentBulletPointId = targetBullet.id;
                  setCurrentInputText(targetBullet.text);

                  setDocumentUpdateRender((r) => r + 1);
                  return;
                }
              }}
              onContentSizeChange={(e) => {
                const newHeight = Math.max(
                  item.textInputHeight,
                  e.nativeEvent.contentSize.height,
                );
                if (newHeight !== item.textInputHeight) {
                  item.textInputHeight = newHeight;
                  setDocumentUpdateRender((count) => count + 1);
                }
              }}
              autoFocus={true}
            />
          ) : (
            <TextInput
              style={[style, { flex: 1, paddingInline: 10 }]}
              multiline
              value={bulletPoint.text}
              editable={false}
              focusable={false}
            />
          )}
        </Pressable>
      );
    });
  };

  const renderBlock = ({ item }: RenderBlockProps): JSX.Element => {
    if (item.blockType === "bulletList" || item.blockType === "numericList") {
      const highlight =
        currentBlockToEdit === item
          ? {
              borderWidth: 4,
              borderColor: colors.primary,
              borderRadius: 25,
            }
          : {};
      return (
        <View
          style={[
            {
              marginVertical: 8,
            },
            highlight,
          ]}
        >
          {renderBulletList(item)}
        </View>
      );
    }

    return (
      <View>
        {item === currentBlockToEdit ? (
          <TextInput
            value={currentInputText}
            scrollEnabled={false}
            style={[
              determineBlockStyle(item.blockType, colors),
              {
                height: item.textInputHeight,
                borderColor: "gray",
                borderWidth: 2,
                borderRadius: 16,
                padding: 10,
                overflow: "hidden",
              },
            ]}
            multiline={true}
            placeholder={`Enter your ${item.blockType}`}
            textAlignVertical="top"
            onChangeText={(text: string) => {
              if (typeof item.text === "string") {
                item.text = text;
                setCurrentInputText(item.text);
              }
            }}
            onContentSizeChange={(e) => {
              const newHeight = Math.max(
                item.textInputHeight,
                e.nativeEvent.contentSize.height,
              );
              if (newHeight !== item.textInputHeight) {
                item.textInputHeight = newHeight;
              }
            }}
          />
        ) : (
          <Text
            onPress={() => {
              setCurrentBlockToEdit(item);
              setCurrentInputText(
                typeof item.text === "string" ? item.text : "",
              );
            }}
            style={[determineBlockStyle(item.blockType, colors)]}
          >
            {typeof item.text === "string" ? item.text : ""}
          </Text>
        )}
      </View>
    );
  };

  const handleDeleteBlock = (): void => {
    const updatedBlocksList = notes.filter((block) => {
      return block !== currentBlockToEdit;
    });

    setNotes(updatedBlocksList);
  };

  if (Platform.OS === "web" && fetchCacheRef.current) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={"padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        {/* Title */}
        <TextInput
          value={notesTitle}
          placeholder="Your Title"
          onChangeText={(text: string) => {
            setNotesTitle(text);
          }}
          style={styles.title}
        />

        {/* Blocks List */}
        <FlatList
          data={notes}
          keyExtractor={(item) => String(item.id)}
          numColumns={1}
          showsVerticalScrollIndicator={true}
          renderItem={renderBlock}
          keyboardShouldPersistTaps="handled"
        />

        {/* Overlay to close dropdown on outside tap */}
        {isDropdownOpen && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setIsDropdownOpen(false)}
            style={styles.dropdownOverlay}
          />
        )}

        {/* Floating Menu */}
        <View style={styles.editorMenuWrapper}>
          <View
            style={[styles.editorMenu, { backgroundColor: colors.surface }]}
          >
            {/* Add Block */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (Platform.OS === "web") {
                  sessionStorage.removeItem(SESSION_KEY);
                }
                router.back();
              }}
            >
              <Feather name="arrow-left" size={22} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={createBlock}
              style={[styles.menuIconBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={22} color={colors.surface} />
            </TouchableOpacity>

            {/* Block Type Selector */}
            <View style={styles.blockSelector}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setIsDropdownOpen((prev) => !prev)}
                style={[
                  styles.selectorTrigger,
                  { backgroundColor: colors.backgrounds.input },
                ]}
              >
                <Text
                  style={[
                    styles.selectorText,
                    { color: colors.text, marginInline: 4 },
                  ]}
                >
                  {getBlockTypeText(currentBlockCreationType)}
                </Text>
                <Ionicons
                  name={isDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              {isDropdownOpen && (
                <View
                  style={[
                    styles.dropdownMenu,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      shadowColor: colors.shadow,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCurrentBlockCreationType("heading");
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Ionicons
                      name="text-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.dropdownItemText, { color: colors.text }]}
                    >
                      Heading
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCurrentBlockCreationType("paragraph");
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.dropdownItemText, { color: colors.text }]}
                    >
                      Paragraph
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCurrentBlockCreationType("bulletList");
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Ionicons name="list" size={16} color={colors.primary} />
                    <Text
                      style={[styles.dropdownItemText, { color: colors.text }]}
                    >
                      Bullet List
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCurrentBlockCreationType("numericList");
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Ionicons name="list" size={16} color={colors.primary} />
                    <Text
                      style={[styles.dropdownItemText, { color: colors.text }]}
                    >
                      Numeric List
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleDeleteBlock}
              style={[styles.menuIconBtn, { backgroundColor: colors.danger }]}
            >
              <Ionicons name="trash" size={20} color={colors.surface} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={async () => {
                try {
                  setIsSaving(true);
                  await onSave();
                } catch (error) {
                  if (setOnSaveError) {
                    setOnSaveError(error);
                  }
                  Alert.alert("Error", "Couldn't save notes!");
                } finally {
                  setIsSaving(false);
                }
              }}
              style={[
                styles.menuIconBtn,
                {
                  backgroundColor: colors.backgrounds.input,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
              disabled={isSaving}
            >
              <Ionicons name="cloud" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TextEditor;
