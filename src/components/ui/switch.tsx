"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SwitchProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(({ className, ...props }, ref) => (
    <label className={cn("ui-switch", className)}>
        <input ref={ref} type="checkbox" {...props} />
        <span className="ui-switch__indicator" aria-hidden />
    </label>
));

Switch.displayName = "Switch";
