"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn("ui-alert", className)} {...props} />
));

Alert.displayName = "Alert";

export const AlertTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className={cn("ui-alert__title", className)} {...props} />
);

export const AlertDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("ui-alert__description", className)} {...props} />
);
