"use client";

import * as React from "react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";

export const AlertDialog = Dialog;
export const AlertDialogContent = DialogContent;
export const AlertDialogDescription = DialogDescription;
export const AlertDialogFooter = DialogFooter;
export const AlertDialogHeader = DialogHeader;
export const AlertDialogTitle = DialogTitle;

export type AlertDialogTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const AlertDialogTrigger = React.forwardRef<HTMLButtonElement, AlertDialogTriggerProps>(({ className, ...props }, ref) => (
    <Button ref={ref} className={className} {...props} />
));

AlertDialogTrigger.displayName = "AlertDialogTrigger";

export const AlertDialogAction = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, ...props }, ref) => <Button ref={ref} className={className} {...props} />
);

AlertDialogAction.displayName = "AlertDialogAction";

export const AlertDialogCancel = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, ...props }, ref) => (
        <Button ref={ref} className={className} data-variant="secondary" {...props} />
    )
);

AlertDialogCancel.displayName = "AlertDialogCancel";
