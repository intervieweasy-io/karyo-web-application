"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Form = ({ className, ...props }: React.FormHTMLAttributes<HTMLFormElement>) => (
    <form className={cn("ui-form", className)} {...props} />
);

export const FormField = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-form__field", className)} {...props} />
);

export const FormItem = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-form__item", className)} {...props} />
);

export const FormLabel = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label className={cn("ui-form__label", className)} {...props} />
);

export const FormControl = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-form__control", className)} {...props} />
);

export const FormDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("ui-form__description", className)} {...props} />
);

export const FormMessage = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("ui-form__message", className)} {...props} />
);
