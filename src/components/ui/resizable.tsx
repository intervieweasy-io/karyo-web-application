"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const ResizablePanelGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-resizable-group", className)} {...props} />
);

export const ResizablePanel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-resizable-panel", className)} {...props} />
);

export const ResizableHandle = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-resizable-handle", className)} {...props} />
);
