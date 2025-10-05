"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Menubar = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-menubar", className)} role="menubar" {...props} />
);

export const MenubarMenu = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-menubar__menu", className)} {...props} />
);

export const MenubarTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, ...props }, ref) => <button ref={ref} type="button" className={cn("ui-menubar__trigger", className)} {...props} />
);

MenubarTrigger.displayName = "MenubarTrigger";

export const MenubarContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-menubar__content", className)} role="menu" {...props} />
);

export const MenubarItem = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-menubar__item", className)} role="menuitem" {...props} />
);

export const MenubarSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className={cn("ui-menubar__separator", className)} {...props} />
);

export const MenubarLabel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-menubar__label", className)} {...props} />
);
