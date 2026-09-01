// axiosInstance.ts
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000/yenerpapi',
});

// ⬅️ INTHA BLOCK PUTHUSA ADD PANNUNGA
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      return Promise.reject({ ...error, isUnauthorized: true });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;