"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, LineChart, UserRound } from "lucide-react";

import { tokenStore } from "@/lib/tokenStore";

const NAV_ITEMS = [
  {
    href: "/tracker",
    label: "Tracker",
    icon: LineChart,
  },
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/profile",
    label: "My Profile",
    icon: UserRound,
  },
] as const;

function isActivePath(currentPath: string, targetPath: string) {
  if (targetPath === "/") {
    return currentPath === "/";
  }

  return currentPath.startsWith(targetPath);
}

export default function AppNavbar() {
  const pathname = usePathname();
  const currentPath = pathname ?? "/";
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    Boolean(tokenStore.get()),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleTokenChange = () => {
      setIsAuthenticated(Boolean(tokenStore.get()));
    };

    handleTokenChange();

    const unsubscribe = tokenStore.subscribe(handleTokenChange);

    const handleStorage = () => {
      handleTokenChange();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const body = document.body;

    if (isAuthenticated) {
      body.classList.add("app-has-navbar");
    } else {
      body.classList.remove("app-has-navbar");
    }

    return () => {
      body.classList.remove("app-has-navbar");
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="app-navbar">
      <div className="app-navbar__inner">
        <Link href="/" className="app-navbar__brand" aria-label="Go to Karyo home">
          <span className="app-navbar__brand-icon">K</span>
          <span className="app-navbar__brand-text">Karyo</span>
        </Link>

        <nav className="app-navbar__nav" aria-label="Primary navigation">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActivePath(currentPath, href);

            return (
              <Link
                key={href}
                href={href}
                className={`app-navbar__link ${active ? "app-navbar__link--active" : ""}`}
              >
                <span className="app-navbar__link-glow" aria-hidden="true" />
                <Icon aria-hidden="true" className="app-navbar__link-icon" />
                <span className="app-navbar__link-label">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
