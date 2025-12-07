import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_WEBSITE_PATH
});

api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.token && user.token.length > 20) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

export default api;