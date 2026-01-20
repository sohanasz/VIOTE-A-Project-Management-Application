import { Alert, Platform } from "react-native";
export function showAlert(title: string, message?: string) {
  if (Platform.OS === "web") {
    if (message) {
      window.alert(`${title}\n\n${message}`);
    } else {
      window.alert(title);
    }
  } else {
    Alert.alert(title, message);
  }
}
