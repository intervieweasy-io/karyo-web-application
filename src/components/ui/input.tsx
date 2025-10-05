"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => {
    return <input ref={ref} type={type} className={cn("ui-input", className)} {...props} />;
});

Input.displayName = "Input";
