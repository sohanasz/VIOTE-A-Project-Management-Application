import axios from "axios";
import { router } from "expo-router";
import { getItemAsync, deleteItemAsync } from "expo-secure-store";
import { Alert, Platform } from "react-native";

const baseURL = "10.25.226.80:8000";

export const api = axios.create({
  baseURL: `http://${baseURL}/api/v1`,
  timeout: 10000,
});

export function initiateInterceptors({ setIsSignedInState }) {
  api.interceptors.request.use(async (config) => {
    let token: string;

    if (Platform.OS !== "web") {
      token = await getItemAsync("token");
    } else {
      token = localStorage.getItem("token");
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      try {
        if (
          error?.response?.data.statusCode === 401 &&
          error?.response?.data.message === "Session Ended"
        ) {
          Alert.alert("Session ended", "Login again for new session");
          if (Platform.OS !== "web") {
            await deleteItemAsync("token");
          } else {
            localStorage.removeItem("token");
          }

          setIsSignedInState(false);
          router.replace("/");
        } else {
          return Promise.reject(error);
        }
      } catch (error) {
        Alert.alert(
          "Network Error",
          "Please check your internet or try signing in again!"
        );
        return Promise.reject(error);
      }
    }
  );
}
