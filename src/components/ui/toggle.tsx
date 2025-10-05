"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    pressed?: boolean;
    onPressedChange?: (pressed: boolean) => void;
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
    ({ pressed, onPressedChange, className, children, ...props }, ref) => {
        const [internal, setInternal] = React.useState(false);
        const isPressed = pressed ?? internal;
        return (
            <button
                ref={ref}
                type="button"
                className={cn("ui-toggle", isPressed && "is-active", className)}
                aria-pressed={isPressed}
                onClick={(event) => {
                    props.onClick?.(event);
                    const next = !isPressed;
                    setInternal(next);
                    onPressedChange?.(next);
                }}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Toggle.displayName = "Toggle";
