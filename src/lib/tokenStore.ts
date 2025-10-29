const KEY = "access_token";
const TOKEN_CHANGE_EVENT = "karyo:token-change";

const notify = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TOKEN_CHANGE_EVENT));
};

export const tokenStore = {
  get: (): string => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem(KEY) || "";
  },
  set: (token: string): void => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(KEY, token);
    notify();
  },
  clear: (): void => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(KEY);
    notify();
  },
  subscribe: (listener: () => void): (() => void) => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    window.addEventListener(TOKEN_CHANGE_EVENT, listener);

    return () => {
      window.removeEventListener(TOKEN_CHANGE_EVENT, listener);
    };
  },
};
