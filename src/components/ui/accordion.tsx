"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
    type?: "single" | "multiple";
    collapsible?: boolean;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
}

const AccordionContext = React.createContext<{
    value: string | null;
    setValue: (value: string) => void;
    type: "single" | "multiple";
    collapsible: boolean;
} | null>(null);

export const Accordion = ({
    className,
    children,
    value,
    defaultValue,
    onValueChange,
    type = "single",
    collapsible = true,
    ...props
}: AccordionProps) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue ?? null);
    const activeValue = value ?? internalValue;

    const setValue = React.useCallback(
        (next: string) => {
            setInternalValue(next);
            onValueChange?.(next);
        },
        [onValueChange]
    );

    return (
        <AccordionContext.Provider
            value={{
                value: activeValue,
                setValue,
                type,
                collapsible,
            }}
        >
            <div className={cn("ui-accordion", className)} {...props}>
                {children}
            </div>
        </AccordionContext.Provider>
    );
};

const useAccordion = () => {
    const context = React.useContext(AccordionContext);
    if (!context) {
        throw new Error("Accordion components must be used within <Accordion>");
    }
    return context;
};

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
}

export const AccordionItem = ({ value, className, children, ...props }: AccordionItemProps) => {
    const { value: activeValue } = useAccordion();
    const isOpen = activeValue === value;
    return (
        <div data-state={isOpen ? "open" : "closed"} className={cn("ui-accordion-item", className)} {...props}>
            {children}
        </div>
    );
};

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string;
}

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
    ({ value, className, ...props }, ref) => {
        const { value: activeValue, setValue, collapsible } = useAccordion();
        const isOpen = activeValue === value;
        return (
            <button
                ref={ref}
                type="button"
                className={cn("ui-accordion-trigger", className)}
                aria-expanded={isOpen}
                data-state={isOpen ? "open" : "closed"}
                onClick={(event) => {
                    props.onClick?.(event);
                    if (isOpen && collapsible) {
                        setValue("");
                    } else {
                        setValue(value);
                    }
                }}
                {...props}
            />
        );
    }
);

AccordionTrigger.displayName = "AccordionTrigger";

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
}

export const AccordionContent = ({ value, className, ...props }: AccordionContentProps) => {
    const { value: activeValue } = useAccordion();
    if (activeValue !== value) {
        return null;
    }
    return <div className={cn("ui-accordion-content", className)} {...props} />;
};
