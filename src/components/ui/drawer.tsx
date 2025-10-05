"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DrawerContextValue {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
}

const DrawerContext = React.createContext<DrawerContextValue | null>(null);

export interface DrawerProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

export const Drawer = ({ open, onOpenChange, children }: DrawerProps) => {
    const value = React.useMemo(() => ({ open, onOpenChange }), [open, onOpenChange]);
    return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
};

const useDrawer = () => {
    const context = React.useContext(DrawerContext);
    if (!context) {
        throw new Error("Drawer components must be used within <Drawer>");
    }
    return context;
};

export const DrawerTrigger = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
        {children}
    </button>
);

export const DrawerContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    const { open, onOpenChange } = useDrawer();
    if (!open) {
        return null;
    }
    return createPortal(
        <div className="ui-drawer-overlay" role="presentation" onClick={() => onOpenChange?.(false)}>
            <aside className={cn("ui-drawer", className)} onClick={(event) => event.stopPropagation()} {...props}>
                {children}
            </aside>
        </div>,
        document.body
    );
};

export const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-drawer__header", className)} {...props} />
);

export const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-drawer__footer", className)} {...props} />
);

export const DrawerTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={cn("ui-drawer__title", className)} {...props} />
);

export const DrawerDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("ui-drawer__description", className)} {...props} />
);

export const DrawerClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, ...props }, ref) => {
        const { onOpenChange } = useDrawer();
        return (
            <button
                ref={ref}
                type="button"
                className={cn("ui-drawer__close", className)}
                onClick={(event) => {
                    props.onClick?.(event);
                    onOpenChange?.(false);
                }}
                {...props}
            />
        );
    }
);

DrawerClose.displayName = "DrawerClose";
