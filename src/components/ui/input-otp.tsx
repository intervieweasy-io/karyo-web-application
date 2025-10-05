"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputOTPProps extends React.HTMLAttributes<HTMLDivElement> {
    length?: number;
    value?: string;
    onChange?: (value: string) => void;
}

export const InputOTP = ({ length = 6, value = "", onChange, className, ...props }: InputOTPProps) => {
    const characters = value.split("");
    return (
        <div className={cn("ui-input-otp", className)} {...props}>
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="ui-input-otp__slot"
                    value={characters[index] ?? ""}
                    onChange={(event) => {
                        const next = characters.slice();
                        next[index] = event.target.value.slice(-1);
                        onChange?.(next.join(""));
                    }}
                />
            ))}
        </div>
    );
};

export const InputOTPSlot = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input className={cn("ui-input-otp__slot", className)} maxLength={1} {...props} />
);
