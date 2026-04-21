import axios from "axios";

import { auth } from "./firebase";
import { getAccessToken, setAccessToken } from "./tokenService";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  let token = getAccessToken();

  if (!token && auth.currentUser) {
    token = await auth.currentUser.getIdToken();
    setAccessToken(token);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;
