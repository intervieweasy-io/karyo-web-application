"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn("ui-select", className)} {...props}>
        {children}
    </select>
));

Select.displayName = "Select";

export const SelectTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn("ui-select__trigger", className)} {...props} />
);

SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-select__content", className)} {...props} />
);

export const SelectItem = ({ className, ...props }: React.OptionHTMLAttributes<HTMLOptionElement>) => (
    <option className={cn("ui-select__item", className)} {...props} />
);

export const SelectValue = ({ placeholder, value }: { placeholder?: string; value?: string }) => (
    <span className="ui-select__value">{value ?? placeholder ?? ""}</span>
);
