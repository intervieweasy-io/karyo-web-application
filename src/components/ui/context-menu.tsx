"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const ContextMenu = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const ContextMenuTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const ContextMenuContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-context-menu", className)} role="menu" {...props} />
);

export const ContextMenuItem = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-context-menu__item", className)} role="menuitem" {...props} />
);

export const ContextMenuSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className={cn("ui-context-menu__separator", className)} {...props} />
);

export const ContextMenuLabel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-context-menu__label", className)} {...props} />
);

export const ContextMenuCheckboxItem = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className={cn("ui-context-menu__checkbox", className)}>
        <input type="checkbox" {...props} />
        <span>{props.children}</span>
    </label>
);

export const ContextMenuRadioGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-context-menu__radio-group", className)} {...props} />
);

export const ContextMenuRadioItem = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className={cn("ui-context-menu__radio", className)}>
        <input type="radio" {...props} />
        <span>{props.children}</span>
    </label>
);
