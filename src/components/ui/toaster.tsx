"use client";

import * as React from "react";
import { Toast } from "./toast";
import type { ToastData } from "./use-toast";
import { useToastListener } from "./use-toast";

export const Toaster = () => {
    const [toasts, setToasts] = React.useState<Required<ToastData>[]>([]);

    useToastListener((action) => {
        if (action.type === "ADD") {
            setToasts((prev) => [...prev.filter((toast) => toast.id !== action.toast.id), action.toast]);
        } else if (action.type === "DISMISS") {
            setToasts((prev) => {
                if (action.id) {
                    return prev.filter((toast) => toast.id !== action.id);
                }
                return [];
            });
        }
    });

    const handleDismiss = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="ui-toaster" role="region" aria-live="polite" aria-label="Notifications">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onDismiss={handleDismiss} />
            ))}
        </div>
    );
};
