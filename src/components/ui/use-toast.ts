"use client";

import * as React from "react";

export type ToastVariant = "default" | "destructive";

export interface ToastData {
    id?: string;
    title?: string;
    description?: string;
    duration?: number;
    variant?: ToastVariant;
}

type ToastAction = { type: "ADD"; toast: Required<ToastData> }; // id required after creation

const listeners = new Set<(action: ToastAction | { type: "DISMISS"; id?: string }) => void>();

const createId = () => Math.random().toString(36).slice(2);

const notify = (action: ToastAction | { type: "DISMISS"; id?: string }) => {
    listeners.forEach((listener) => listener(action));
};

export const useToast = () => {
    const toast = React.useCallback((data: ToastData) => {
        const id = data.id ?? createId();
        const payload: Required<ToastData> = {
            id,
            title: data.title ?? "",
            description: data.description ?? "",
            duration: data.duration ?? 4000,
            variant: data.variant ?? "default",
        };
        notify({ type: "ADD", toast: payload });
        return payload;
    }, []);

    const dismiss = React.useCallback((id?: string) => {
        notify({ type: "DISMISS", id });
    }, []);

    return { toast, dismiss };
};

export const useToastListener = (
    listener: (action: ToastAction | { type: "DISMISS"; id?: string }) => void
) => {
    React.useEffect(() => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, [listener]);
};
