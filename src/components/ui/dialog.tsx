"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DialogContextValue {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

export interface DialogProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
    const value = React.useMemo(() => ({ open, onOpenChange }), [open, onOpenChange]);
    return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
};

const useDialog = () => {
    const context = React.useContext(DialogContext);
    if (!context) {
        throw new Error("Dialog components must be used within a Dialog");
    }
    return context;
};

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
    overlayClassName?: string;
}

export const DialogContent = ({ className, overlayClassName, children, ...props }: DialogContentProps) => {
    const { open, onOpenChange } = useDialog();
    const content = !open
        ? null
        : createPortal(
              <div className={cn("ui-dialog-overlay", overlayClassName)} role="presentation" onClick={() => onOpenChange?.(false)}>
                  <div
                      className={cn("ui-dialog-content", className)}
                      role="dialog"
                      aria-modal="true"
                      onClick={(event) => event.stopPropagation()}
                      {...props}
                  >
                      {children}
                  </div>
              </div>,
              document.body
          );

    return content;
};

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-dialog-header", className)} {...props} />
);

export const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={cn("ui-dialog-title", className)} {...props} />
);

export const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("ui-dialog-description", className)} {...props} />
);

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-dialog-footer", className)} {...props} />
);

export const DialogClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, ...props }, ref) => {
        const { onOpenChange } = useDialog();
        return (
            <button
                ref={ref}
                type="button"
                className={cn("ui-dialog-close", className)}
                onClick={(event) => {
                    props.onClick?.(event);
                    onOpenChange?.(false);
                }}
                {...props}
            />
        );
    }
);

DialogClose.displayName = "DialogClose";
