"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
    value: string;
    setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultValue: string;
    value?: string;
    onValueChange?: (value: string) => void;
}

export const Tabs = ({ defaultValue, value, onValueChange, className, children, ...props }: TabsProps) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);

    const activeValue = value ?? internalValue;

    const setValue = React.useCallback(
        (next: string) => {
            setInternalValue(next);
            onValueChange?.(next);
        },
        [onValueChange]
    );

    const contextValue = React.useMemo(() => ({ value: activeValue, setValue }), [activeValue, setValue]);

    React.useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    return (
        <TabsContext.Provider value={contextValue}>
            <div className={cn("ui-tabs", className)} {...props}>
                {children}
            </div>
        </TabsContext.Provider>
    );
};

const useTabs = () => {
    const context = React.useContext(TabsContext);
    if (!context) {
        throw new Error("Tabs components must be used inside <Tabs>");
    }
    return context;
};

export const TabsList = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-tabs-list", className)} role="tablist" {...props} />
);

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(({ value, className, ...props }, ref) => {
    const { value: activeValue, setValue } = useTabs();
    const isActive = activeValue === value;
    return (
        <button
            ref={ref}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-state={isActive ? "active" : "inactive"}
            className={cn("ui-tabs-trigger", className)}
            onClick={(event) => {
                props.onClick?.(event);
                setValue(value);
            }}
            {...props}
        />
    );
});

TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
}

export const TabsContent = ({ value, className, ...props }: TabsContentProps) => {
    const { value: activeValue } = useTabs();
    if (activeValue !== value) {
        return null;
    }
    return <div role="tabpanel" className={cn("ui-tabs-content", className)} {...props} />;
};
