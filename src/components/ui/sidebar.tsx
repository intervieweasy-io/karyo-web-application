"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Sidebar = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <aside className={cn("ui-sidebar", className)} {...props} />
);

export const SidebarHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-sidebar__header", className)} {...props} />
);

export const SidebarContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-sidebar__content", className)} {...props} />
);

export const SidebarFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-sidebar__footer", className)} {...props} />
);
