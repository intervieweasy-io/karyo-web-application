"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "overflow-y-auto overscroll-contain [scrollbar-gutter:stable] -mx-2 px-2",
                className
            )}
            {...props}
        />
    )
);
ScrollArea.displayName = "ScrollArea";

export const ScrollBar = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("hidden", className)} {...props} />
);
