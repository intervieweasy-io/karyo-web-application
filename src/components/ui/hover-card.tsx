"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const HoverCard = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const HoverCardTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const HoverCardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-hover-card", className)} {...props} />
);
