
const KEY = "access_token";

export const tokenStore = {
  get: (): string => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem(KEY) || "";
  },
  set: (token: string): void => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(KEY, token);
  },
  clear: (): void => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(KEY);
  }
};
