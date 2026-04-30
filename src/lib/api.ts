import axios from "axios";
import { handleMockRequest } from "./mockBackend";

const api = axios.create({
  adapter: handleMockRequest,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && !config.headers?.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getMediaUrl = (imagePath: string): string => {
  if (!imagePath) return "";
  return imagePath;
};

export default api;
