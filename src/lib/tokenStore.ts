
const KEY = "access_token";

export const tokenStore = {
  get: (): string => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(KEY) || "";
  },
  set: (token: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, token);
  },
  clear: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEY);
  }
};
