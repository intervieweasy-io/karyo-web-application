"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "ghost" | "link" | "danger";
type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    return (
        <button
            ref={ref}
            type={type}
            data-variant={variant}
            data-size={size}
            className={cn("ui-button", className)}
            {...props}
        />
    );
});

Button.displayName = "Button";
