"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Separator = ({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className={cn("ui-separator", className)} {...props} />
);
