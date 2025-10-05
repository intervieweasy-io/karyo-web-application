"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number;
    max?: number;
}

export const Progress = ({ value = 0, max = 100, className, ...props }: ProgressProps) => {
    const percent = Math.min(Math.max(value / max, 0), 1) * 100;
    return (
        <div className={cn("ui-progress", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} {...props}>
            <div className="ui-progress__indicator" style={{ width: `${percent}%` }} />
        </div>
    );
};
