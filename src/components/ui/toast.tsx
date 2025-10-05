"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ToastData } from "./use-toast";

export interface ToastProps {
    toast: Required<ToastData>;
    onDismiss?: (id: string) => void;
}

export const Toast = ({ toast, onDismiss }: ToastProps) => {
    React.useEffect(() => {
        if (!toast.duration) return;
        const timer = window.setTimeout(() => {
            onDismiss?.(toast.id);
        }, toast.duration);
        return () => window.clearTimeout(timer);
    }, [toast, onDismiss]);

    return (
        <div className={cn("ui-toast", toast.variant === "destructive" && "ui-toast--destructive")}
            role="status"
            aria-live="polite"
        >
            <div className="ui-toast__content">
                {toast.title && <p className="ui-toast__title">{toast.title}</p>}
                {toast.description && <p className="ui-toast__description">{toast.description}</p>}
            </div>
            <button type="button" className="ui-toast__close" onClick={() => onDismiss?.(toast.id)} aria-label="Dismiss notification">
                ×
            </button>
        </div>
    );
};
