"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { cn } from "@/lib/utils";

export const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("ui-avatar", className)} {...props} />
));

Avatar.displayName = "Avatar";

export type AvatarImageProps = React.ImgHTMLAttributes<HTMLImageElement>;

export const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(({ className, alt = "", ...props }, ref) => (
    <img ref={ref} className={cn("ui-avatar__image", className)} alt={alt} {...props} />
));

AvatarImage.displayName = "AvatarImage";

export const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("ui-avatar__fallback", className)} {...props} />
    )
);

AvatarFallback.displayName = "AvatarFallback";
