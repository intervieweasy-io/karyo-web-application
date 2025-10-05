"use client";

import * as React from "react";

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    min?: number;
    max?: number;
    step?: number;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(({ min = 0, max = 100, step = 1, ...props }, ref) => (
    <input ref={ref} type="range" min={min} max={max} step={step} {...props} />
));

Slider.displayName = "Slider";
