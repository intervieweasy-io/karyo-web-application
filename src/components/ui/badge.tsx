"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "default" | "secondary" | "outline";
}

export const Badge = ({ className, variant = "default", ...props }: BadgeProps) => (
    <span className={cn("ui-badge", `ui-badge--${variant}`, className)} {...props} />
);
