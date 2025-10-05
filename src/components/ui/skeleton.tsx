"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Skeleton = ({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-skeleton", className)} style={{ animation: "ui-pulse 1.5s ease-in-out infinite", ...style }} {...props} />
);
