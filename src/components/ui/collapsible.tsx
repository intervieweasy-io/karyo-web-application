"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CollapsibleContextValue {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const Collapsible = ({ open, defaultOpen = false, onOpenChange, className, children, ...props }: CollapsibleProps) => {
    const [internal, setInternal] = React.useState(defaultOpen);
    const isOpen = open ?? internal;

    const setOpen = React.useCallback(
        (value: boolean) => {
            setInternal(value);
            onOpenChange?.(value);
        },
        [onOpenChange]
    );

    return (
        <CollapsibleContext.Provider value={{ open: isOpen, setOpen }}>
            <div className={cn("ui-collapsible", className)} {...props}>
                {children}
            </div>
        </CollapsibleContext.Provider>
    );
};

const useCollapsible = () => {
    const context = React.useContext(CollapsibleContext);
    if (!context) {
        throw new Error("Collapsible components must be used within <Collapsible>");
    }
    return context;
};

export const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, ...props }, ref) => {
        const { open, setOpen } = useCollapsible();
        return (
            <button
                ref={ref}
                type="button"
                className={cn("ui-collapsible__trigger", className)}
                aria-expanded={open}
                onClick={(event) => {
                    props.onClick?.(event);
                    setOpen(!open);
                }}
                {...props}
            />
        );
    }
);

CollapsibleTrigger.displayName = "CollapsibleTrigger";

export const CollapsibleContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    const { open } = useCollapsible();
    if (!open) {
        return null;
    }
    return <div className={cn("ui-collapsible__content", className)} {...props} />;
};
