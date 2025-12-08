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

// Response interceptor to attempt refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (!originalRequest) return Promise.reject(err);

    // only attempt once
    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // find refresh token
      const refresh = localStorage.getItem("refresh_token") || (() => {
        try {
          const u = JSON.parse(localStorage.getItem("user"));
          return u?.refresh_token;
        } catch { return null; }
      })();

      if (refresh) {
        try {
          // call /refresh with refresh token as Bearer
          const resp = await axios.post(`${process.env.REACT_APP_WEBSITE_PATH}/refresh`, {}, {
            headers: { Authorization: `Bearer ${refresh}` }
          });

          const newAccess = resp.data.access_token;
          const newRefresh = resp.data.refresh_token;
          if (newAccess) {
            // update local storage and default headers
            try {
              const userStr = localStorage.getItem("user");
              if (userStr) {
                const user = JSON.parse(userStr);
                user.token = newAccess;
                if (newRefresh) user.refresh_token = newRefresh;
                localStorage.setItem("user", JSON.stringify(user));
              }
            } catch {}
            localStorage.setItem("token", newAccess);
            if (newRefresh) localStorage.setItem("refresh_token", newRefresh);
            api.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;
            originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;

            return api(originalRequest);
          }
        } catch (refreshErr) {
          // refresh failed: clear storage and redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          window.location.href = "/auth/login";
          return Promise.reject(refreshErr);
        }
      }
    }

    return Promise.reject(err);
  }
);