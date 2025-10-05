"use client";

import * as React from "react";

export interface CalendarProps extends React.InputHTMLAttributes<HTMLInputElement> {
    selected?: Date;
    onSelect?: (date: Date | undefined) => void;
}

export const Calendar = React.forwardRef<HTMLInputElement, CalendarProps>(({ selected, onSelect, ...props }, ref) => {
    const formatted = selected ? selected.toISOString().split("T")[0] : "";
    return (
        <input
            ref={ref}
            type="date"
            value={formatted}
            onChange={(event) => {
                const value = event.target.value;
                if (!value) {
                    onSelect?.(undefined);
                } else {
                    onSelect?.(new Date(value));
                }
            }}
            {...props}
        />
    );
});

Calendar.displayName = "Calendar";
