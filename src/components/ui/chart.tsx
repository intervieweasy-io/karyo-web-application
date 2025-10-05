"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
    data?: unknown;
}

export const Chart = ({ className, children, ...props }: ChartProps) => (
    <div className={cn("ui-chart", className)} {...props}>
        {children}
    </div>
);
