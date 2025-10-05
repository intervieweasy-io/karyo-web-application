"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Breadcrumb = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <nav aria-label="Breadcrumb" className={cn("ui-breadcrumb", className)} {...props} />
);

export const BreadcrumbList = ({ className, ...props }: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className={cn("ui-breadcrumb__list", className)} {...props} />
);

export const BreadcrumbItem = ({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li className={cn("ui-breadcrumb__item", className)} {...props} />
);

export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
    ({ className, ...props }, ref) => <a ref={ref} className={cn("ui-breadcrumb__link", className)} {...props} />
);

BreadcrumbLink.displayName = "BreadcrumbLink";

export const BreadcrumbSeparator = ({ className, children = "/", ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span className={cn("ui-breadcrumb__separator", className)} role="presentation" {...props}>
        {children}
    </span>
);

export const BreadcrumbEllipsis = (props: React.HTMLAttributes<HTMLSpanElement>) => (
    <BreadcrumbSeparator {...props}>…</BreadcrumbSeparator>
);

export const BreadcrumbPage = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span className={cn("ui-breadcrumb__page", className)} aria-current="page" {...props} />
);
