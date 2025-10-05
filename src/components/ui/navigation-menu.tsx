"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const NavigationMenu = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <nav className={cn("ui-navigation-menu", className)} {...props} />
);

export const NavigationMenuList = ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className={cn("ui-navigation-menu__list", className)} {...props} />
);

export const NavigationMenuItem = ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className={cn("ui-navigation-menu__item", className)} {...props} />
);

export const NavigationMenuLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
    ({ className, ...props }, ref) => <a ref={ref} className={cn("ui-navigation-menu__link", className)} {...props} />
);

NavigationMenuLink.displayName = "NavigationMenuLink";

export const NavigationMenuTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, ...props }, ref) => <button ref={ref} type="button" className={cn("ui-navigation-menu__trigger", className)} {...props} />
);

NavigationMenuTrigger.displayName = "NavigationMenuTrigger";

export const NavigationMenuContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-navigation-menu__content", className)} {...props} />
);
