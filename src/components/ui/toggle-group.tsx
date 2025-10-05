"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleGroupContextValue {
    value: string[];
    setValue: (value: string[]) => void;
    type: "single" | "multiple";
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(null);

export interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    type?: "single" | "multiple";
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
}

export const ToggleGroup = ({
    type = "single",
    value,
    defaultValue,
    onValueChange,
    className,
    children,
    ...props
}: ToggleGroupProps) => {
    const [internal, setInternal] = React.useState<string[]>(defaultValue ?? []);
    const current = value ?? internal;

    const setValue = React.useCallback(
        (next: string[]) => {
            setInternal(next);
            onValueChange?.(next);
        },
        [onValueChange]
    );

    return (
        <ToggleGroupContext.Provider value={{ value: current, setValue, type }}>
            <div className={cn("ui-toggle-group", className)} role="group" {...props}>
                {children}
            </div>
        </ToggleGroupContext.Provider>
    );
};

const useToggleGroup = () => {
    const context = React.useContext(ToggleGroupContext);
    if (!context) {
        throw new Error("ToggleGroupItem must be used within <ToggleGroup>");
    }
    return context;
};

export interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string;
}

export const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(({ value, className, ...props }, ref) => {
    const { value: selected, setValue, type } = useToggleGroup();
    const isActive = selected.includes(value);
    return (
        <button
            ref={ref}
            type="button"
            className={cn("ui-toggle-group__item", isActive && "is-active", className)}
            aria-pressed={isActive}
            onClick={(event) => {
                props.onClick?.(event);
                if (type === "single") {
                    setValue(isActive ? [] : [value]);
                } else {
                    const next = isActive ? selected.filter((item) => item !== value) : [...selected, value];
                    setValue(next);
                }
            }}
            {...props}
        />
    );
});

ToggleGroupItem.displayName = "ToggleGroupItem";
