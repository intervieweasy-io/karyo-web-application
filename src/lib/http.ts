/* eslint-disable */

import axios, { AxiosError, AxiosRequestConfig, AxiosHeaders } from "axios";
import { tokenStore } from "./tokenStore";

const baseURL = "https://api.intervieweasy.io/api";

export const http = axios.create({ baseURL, withCredentials: true });
const refreshHttp = axios.create({ baseURL, withCredentials: true });

let refreshing = false;
let queue: Array<() => void> = [];

const flushQueue = () => {
  queue.forEach((resolve) => resolve());
  queue = [];
};

const clearSessionAndReload = () => {
  tokenStore.clear?.(); // optional chaining in case clear() isn’t defined
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/login"; // redirect to login page
};

http.interceptors.request.use((cfg) => {
  const t = tokenStore.get();
  if (t) {
    cfg.headers = cfg.headers || {};
    if ((cfg.headers as any).set) {
      (cfg.headers as any).set("Authorization", `Bearer ${t}`);
    } else {
      cfg.headers["Authorization"] = `Bearer ${t}`;
    }
  }
  return cfg;
});

http.interceptors.response.use(
  (res) => res,
  async (
    err: AxiosError & { config?: AxiosRequestConfig & { __retried?: boolean } }
  ) => {
    const orig = err.config;
    if (err.response?.status === 401 && orig && !orig.__retried) {
      if (refreshing) {
        await new Promise<void>((res) => queue.push(res));
        orig.__retried = true;
        return http(orig);
      }

      try {
        refreshing = true;
        const { data } = await refreshHttp.post("/auth/refresh");
        tokenStore.set(data.access);
        flushQueue();

        orig.__retried = true;
        if (orig.headers) {
          (orig.headers as AxiosHeaders).set(
            "Authorization",
            `Bearer ${data.access}`
          );
        }
        return http(orig);
      } catch (refreshErr) {
        // refresh also failed → logout user
        clearSessionAndReload();
        return Promise.reject(refreshErr);
      } finally {
        refreshing = false;
      }
    }

    throw err;
  }
);
