import { StyleSheet } from "react-native";
import { ColorScheme } from "@/hooks/useTheme";

export const createCreateNoteStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    title: {
      color: colors.primary,
      fontSize: 40,
      marginTop: 13,
      marginBottom: 13,
      fontWeight: 800,
    },
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingLeft: 10,
      paddingRight: 10,
      paddingBottom: 125,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
    },
    previewBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    previewText: {
      color: colors.primary,
      fontWeight: "500",
    },
    titleInput: {
      backgroundColor: colors.backgrounds.input,
      color: colors.text,
      fontSize: 18,
      padding: 14,
      borderRadius: 10,
      marginBottom: 12,
    },

    editor: {
      flex: 1,
      backgroundColor: colors.backgrounds.input,
      color: colors.text,
      padding: 16,
      borderRadius: 12,
      fontSize: 15,
    },

    saveBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 12,
    },

    saveText: {
      color: colors.surface,
      fontWeight: "600",
      fontSize: 16,
    },

    disabled: {
      opacity: 0.6,
    },

    editorMenu: {
      position: "absolute",
      bottom: 20,

      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderRadius: 16,

      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },

    menuIconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },

    blockSelector: {
      position: "relative",
      alignSelf: "flex-start",
      marginHorizontal: 0,
    },

    selectorTrigger: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 12,
      alignSelf: "flex-start",
    },

    selectorText: {
      fontSize: 14,
      fontWeight: "600",
    },

    dropdownMenu: {
      position: "absolute",
      bottom: 52,
      alignSelf: "flex-start",
      minWidth: 160,
      borderRadius: 12,
      borderWidth: 1,
      overflow: "hidden",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 10,
    },

    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },

    dropdownItemText: {
      fontSize: 14,
      fontWeight: "500",
    },

    editorMenuWrapper: {
      position: "absolute",
      bottom: 28,
      left: 0,
      right: 0,
      alignItems: "center",
    },

    dropdownOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
    },
    menuDivider: {
      width: 1,
      height: 28,
      backgroundColor: colors.border,
      marginHorizontal: 1,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });

export function determineBlockStyle(blockType: string, colors: ColorScheme) {
  const BlockTypeBasedInputStyles = StyleSheet.create({
    heading: {
      color: colors.text,
      fontSize: 25,
      marginTop: 10,
      marginBottom: 10,
      fontWeight: 700,
    },
    paragraph: {
      color: colors.text,
      fontSize: 15,
      marginVertical: 10,
    },
    bulletList: {
      color: colors.text,
      fontSize: 15,
    },
    numericList: {
      color: colors.text,
      fontSize: 15,
      marginVertical: 5,
    },
  });

  return BlockTypeBasedInputStyles[blockType];
}
