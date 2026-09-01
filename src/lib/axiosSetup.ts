import axios from "axios";
import store from "@/redux/store";
import {
  forceLogout,
  setSnackbarMessage,
  setSnackbarOpen,
} from "@/features/authSlice";

let isInterceptorAdded = false;

export const setupAxios = () => {
  if (isInterceptorAdded) return;
  isInterceptorAdded = true;

  // ⬅️ INTHA REQUEST INTERCEPTOR PUTHUSA ADD PANNUNGA
  axios.interceptors.request.use(
    (config) => {
      const token = sessionStorage.getItem("accessToken");
      if (token) {
        config.headers = config.headers || {};
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        const username = sessionStorage.getItem("username");
        const tenantId = sessionStorage.getItem("tenant_id");

        store.dispatch(setSnackbarMessage("Session expired. Please login again."));
        store.dispatch(setSnackbarOpen(true));
        store.dispatch(forceLogout());

        localStorage.setItem(
          "forceLogout",
          JSON.stringify({ username, tenantId, time: Date.now() })
        );

        window.location.href = "/";
      }
      return Promise.reject(error);
    }
  );
};