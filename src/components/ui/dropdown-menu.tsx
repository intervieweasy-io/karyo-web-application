"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, ...props }, ref) => <button ref={ref} type="button" className={cn("ui-dropdown__trigger", className)} {...props} />
);

DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

export const DropdownMenuContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-dropdown", className)} role="menu" {...props} />
);

export const DropdownMenuLabel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-dropdown__label", className)} {...props} />
);

export const DropdownMenuItem = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-dropdown__item", className)} role="menuitem" tabIndex={0} {...props} />
);

export const DropdownMenuSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className={cn("ui-dropdown__separator", className)} {...props} />
);

export const DropdownMenuCheckboxItem = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className={cn("ui-dropdown__checkbox", className)}>
        <input type="checkbox" {...props} />
        <span>{props.children}</span>
    </label>
);

export const DropdownMenuRadioGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-dropdown__radio-group", className)} {...props} />
);

export const DropdownMenuRadioItem = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className={cn("ui-dropdown__radio", className)}>
        <input type="radio" {...props} />
        <span>{props.children}</span>
    </label>
);
