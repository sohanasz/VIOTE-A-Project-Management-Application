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
import { router } from "expo-router";

const SESSION_KEY = "TEXT_EDITOR_DRAFT";

const TextEditor = ({
  notesTitle,
  setNotesTitle,
  notes,
  setNotes,
  colors,
  onSave,
  setOnSaveError,
}) => {
  const styles = createCreateNoteStyles(colors);

  const [currentBlockCreationType, setCurrentBlockCreationType] =
    useState("heading");
  const [blockId, setBlockId] = useState<number>(0);
  const [currentBlockToEdit, setCurrentBlockToEdit] = useState({});
  const [currentInputText, setCurrentInputText] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [documentUpdateRender, setDocumentUpdateRender] = useState(0);
  const fetchCache = useRef(true);

  useEffect(() => {
    if (notes && notes.length > 0) {
      const lastId = notes[notes.length - 1].id;
      setBlockId(lastId);
    }
  }, [notes]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (fetchCache.current) return;

    const payload = {
      notesTitle,
      notes: Array.isArray(notes) ? notes : [],
    };

    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to save editor draft", e);
    }
  }, [notesTitle, notes, documentUpdateRender]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!fetchCache.current) return;
    fetchCache.current = false;

    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);

      if (parsed?.notes && Array.isArray(parsed.notes)) {
        setNotes(parsed.notes);
      }

      if (typeof parsed?.notesTitle === "string") {
        setNotesTitle(parsed.notesTitle);
      }
    } catch (e) {
      console.warn("Failed to restore editor draft", e);
    }
  }, []);

  const getBlockTypeText = (type) => {
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

  const createBlock = () => {
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
    }

    block["id"] = blockId + 1;

    setBlockId(blockId + 1);

    setNotes((notes) => {
      return [...notes, block];
    });
  };

  const renderBulletList = (item) => {
    const style = determineBlockStyle(item.blockType, colors);
    return item.text.map((bulletPoint) => {
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
              onChangeText={(text) => {
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
                  let currentArray = item.text;
                  const newArray = [];
                  const bulletPointToInsert = new BulletPoint(null, "");
                  let trackId: boolean | number = false;

                  for (let index = 0; index < currentArray.length; index++) {
                    newArray.push(currentArray[index]);
                    if (currentArray[index] === bulletPoint) {
                      const newId = currentArray[index].id + 1;
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
                  let currentArray = item.text;
                  const newArray = [];
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
                  e.nativeEvent.contentSize.height
                );
                if (newHeight !== item.textInputHeight) {
                  item.textInputHeight = newHeight;
                  setDocumentUpdateRender((count) => count + 1);
                }
              }}
              autoFocus={true}
            ></TextInput>
          ) : (
            <TextInput
              style={[style, { flex: 1, paddingInline: 10 }]}
              multiline
              value={bulletPoint.text}
              editable={false}
              focusable={false}
            ></TextInput>
          )}
        </Pressable>
      );
    });
  };

  const renderBlock = ({ item }) => {
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
            onChangeText={(text) => {
              item.text = text;
              setCurrentInputText(item.text);
            }}
            onContentSizeChange={(e) => {
              const newHeight = Math.max(
                item.textInputHeight,
                e.nativeEvent.contentSize.height
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
              setCurrentInputText(item.text);
            }}
            style={[determineBlockStyle(item.blockType, colors)]}
          >
            {item.text}
          </Text>
        )}
      </View>
    );
  };

  const handleDeleteBlock = () => {
    const updatedBlocksList = notes.filter((block) => {
      return block !== currentBlockToEdit;
    });

    setNotes(updatedBlocksList);
  };

  if (Platform.OS === "web" && fetchCache.current) {
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
          // placeholderTextColor={colors.primary}
          onChangeText={(text) => {
            setNotesTitle(text);
          }}
          style={styles.title}
        ></TextInput>

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
