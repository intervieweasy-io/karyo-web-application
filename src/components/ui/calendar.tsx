"use client";

import * as React from "react";

export interface CalendarProps
    extends Omit<
        React.InputHTMLAttributes<HTMLInputElement>,
        "onSelect" | "value" | "defaultValue" | "type"
    > {
    selected?: Date;
    onSelect?: (date: Date | undefined) => void;
}

export const Calendar = React.forwardRef<HTMLInputElement, CalendarProps>(
    ({ selected, onSelect, onChange, ...props }, ref) => {
        const formatted = selected ? selected.toISOString().split("T")[0] : "";
        return (
            <input
                ref={ref}
                type="date"
                value={formatted}
                onChange={(event) => {
                    const value = event.target.value;
                    const next = value ? new Date(value) : undefined;
                    onSelect?.(next);
                    onChange?.(event);
                }}
                {...props}
            />
        );
    }
);

Calendar.displayName = "Calendar";
