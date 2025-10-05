"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const ScrollArea = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-scroll-area", className)} {...props} />
);

export const ScrollBar = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-scroll-bar", className)} {...props} />
);
