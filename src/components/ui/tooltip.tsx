"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipContextValue {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

export interface TooltipProps {
    children: React.ReactNode;
}

export const Tooltip = ({ children }: TooltipProps) => {
    const [open, setOpen] = React.useState(false);

    return (
        <TooltipContext.Provider value={{ open, setOpen }}>
            <span className="ui-tooltip" onMouseLeave={() => setOpen(false)}>
                {children}
            </span>
        </TooltipContext.Provider>
    );
};

const useTooltip = () => {
    const context = React.useContext(TooltipContext);
    if (!context) {
        throw new Error("Tooltip components must be used inside <Tooltip>");
    }
    return context;
};

export const TooltipTrigger = ({ children }: { children: React.ReactNode }) => {
    const { setOpen } = useTooltip();
    return (
        <span
            className="ui-tooltip__trigger"
            onMouseEnter={() => setOpen(true)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
        >
            {children}
        </span>
    );
};

export const TooltipContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    const { open } = useTooltip();
    if (!open) return null;
    return (
        <div className={cn("ui-tooltip__content", className)} role="tooltip" {...props}>
            {children}
        </div>
    );
};
