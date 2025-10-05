"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PopoverContextValue {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

export interface PopoverProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

export const Popover = ({ open, defaultOpen = false, onOpenChange, children }: PopoverProps) => {
    const [internal, setInternal] = React.useState(defaultOpen);
    const isOpen = open ?? internal;

    const setOpen = React.useCallback(
        (next: boolean) => {
            setInternal(next);
            onOpenChange?.(next);
        },
        [onOpenChange]
    );

    return <PopoverContext.Provider value={{ open: isOpen, setOpen }}>{children}</PopoverContext.Provider>;
};

const usePopover = () => {
    const context = React.useContext(PopoverContext);
    if (!context) {
        throw new Error("Popover components must be used within <Popover>");
    }
    return context;
};

export const PopoverTrigger = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    const { open, setOpen } = usePopover();
    return (
        <button
            type="button"
            className={cn("ui-popover__trigger", className)}
            aria-expanded={open}
            onClick={(event) => {
                props.onClick?.(event);
                setOpen(!open);
            }}
            {...props}
        />
    );
};

export const PopoverContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    const { open } = usePopover();
    if (!open) return null;
    return (
        <div className={cn("ui-popover", className)} role="dialog" {...props}>
            {children}
        </div>
    );
};
