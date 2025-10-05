"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Command = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-command", className)} role="listbox" {...props} />
);

export const CommandInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => <input ref={ref} className={cn("ui-command__input", className)} {...props} />
);

CommandInput.displayName = "CommandInput";

export const CommandList = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-command__list", className)} {...props} />
);

export const CommandGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-command__group", className)} {...props} />
);

export const CommandItem = ({ className, "aria-selected": ariaSelected, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-command__item", className)} role="option" aria-selected={ariaSelected ?? false} {...props} />
);

export const CommandSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className={cn("ui-command__separator", className)} {...props} />
);

export const CommandEmpty = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-command__empty", className)} {...props} />
);
