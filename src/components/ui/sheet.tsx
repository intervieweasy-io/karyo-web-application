"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface SheetContextValue {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

export interface SheetProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

export const Sheet = ({ open, onOpenChange, children }: SheetProps) => {
    const value = React.useMemo(() => ({ open, onOpenChange }), [open, onOpenChange]);
    return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
};

const useSheet = () => {
    const context = React.useContext(SheetContext);
    if (!context) {
        throw new Error("Sheet components must be used within <Sheet>");
    }
    return context;
};

export const SheetTrigger = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" className={cn("ui-sheet__trigger", className)} {...props} />
);

export const SheetContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    const { open, onOpenChange } = useSheet();
    if (!open) return null;
    return createPortal(
        <div className="ui-sheet-overlay" role="presentation" onClick={() => onOpenChange?.(false)}>
            <div className={cn("ui-sheet", className)} onClick={(event) => event.stopPropagation()} {...props}>
                {children}
            </div>
        </div>,
        document.body
    );
};

export const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-sheet__header", className)} {...props} />
);

export const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-sheet__footer", className)} {...props} />
);

export const SheetTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={cn("ui-sheet__title", className)} {...props} />
);

export const SheetDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("ui-sheet__description", className)} {...props} />
);

export const SheetClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, ...props }, ref) => {
        const { onOpenChange } = useSheet();
        return (
            <button
                ref={ref}
                type="button"
                className={cn("ui-sheet__close", className)}
                onClick={(event) => {
                    props.onClick?.(event);
                    onOpenChange?.(false);
                }}
                {...props}
            />
        );
    }
);

SheetClose.displayName = "SheetClose";
