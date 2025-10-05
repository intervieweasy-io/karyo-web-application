"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
    value: string | undefined;
    setValue: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
}

export const RadioGroup = ({ value, defaultValue, onValueChange, className, children, ...props }: RadioGroupProps) => {
    const [internal, setInternal] = React.useState(defaultValue);
    const current = value ?? internal;

    const setValue = React.useCallback(
        (next: string) => {
            setInternal(next);
            onValueChange?.(next);
        },
        [onValueChange]
    );

    return (
        <RadioGroupContext.Provider value={{ value: current, setValue }}>
            <div className={cn("ui-radio-group", className)} role="radiogroup" {...props}>
                {children}
            </div>
        </RadioGroupContext.Provider>
    );
};

const useRadioGroup = () => {
    const context = React.useContext(RadioGroupContext);
    if (!context) {
        throw new Error("RadioGroupItem must be used inside <RadioGroup>");
    }
    return context;
};

export interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string;
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(({ value, className, ...props }, ref) => {
    const { value: selected, setValue } = useRadioGroup();
    return (
        <label className={cn("ui-radio-group__item", className)}>
            <input
                ref={ref}
                type="radio"
                checked={selected === value}
                onChange={() => setValue(value)}
                {...props}
            />
            <span>{props.children}</span>
        </label>
    );
});

RadioGroupItem.displayName = "RadioGroupItem";
