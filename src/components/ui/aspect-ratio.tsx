"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
    ratio?: number;
}

export const AspectRatio = ({ ratio = 16 / 9, className, style, children, ...props }: AspectRatioProps) => {
    return (
        <div
            className={cn("ui-aspect-ratio", className)}
            style={{
                position: "relative",
                paddingBottom: `${100 / ratio}%`,
                ...style,
            }}
            {...props}
        >
            <div style={{ position: "absolute", inset: 0 }}>{children}</div>
        </div>
    );
};
