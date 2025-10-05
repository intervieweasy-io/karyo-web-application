"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CarouselContextValue {
    index: number;
    setIndex: (index: number) => void;
    count: number;
    registerItem: () => number;
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

export type CarouselProps = React.HTMLAttributes<HTMLDivElement>;

export const Carousel = ({ className, children, ...props }: CarouselProps) => {
    const [index, setIndex] = React.useState(0);
    const [count, setCount] = React.useState(0);

    const registerItem = React.useCallback(() => {
        setCount((prev) => prev + 1);
        return count;
    }, [count]);

    const value = React.useMemo(() => ({ index, setIndex, count, registerItem }), [index, count, registerItem]);

    return (
        <CarouselContext.Provider value={value}>
            <div className={cn("ui-carousel", className)} {...props}>
                {children}
            </div>
        </CarouselContext.Provider>
    );
};

const useCarousel = () => {
    const context = React.useContext(CarouselContext);
    if (!context) {
        throw new Error("Carousel components must be used within <Carousel>");
    }
    return context;
};

export const CarouselContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("ui-carousel__content", className)} {...props} />
);

export const CarouselItem = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    const { registerItem } = useCarousel();
    React.useEffect(() => {
        registerItem();
    }, [registerItem]);
    return <div className={cn("ui-carousel__item", className)} {...props} />;
};

export const CarouselNext = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    const { index, setIndex, count } = useCarousel();
    return (
        <button
            type="button"
            className={cn("ui-carousel__control", className)}
            onClick={(event) => {
                props.onClick?.(event);
                setIndex((index + 1) % Math.max(count, 1));
            }}
            {...props}
        >
            ›
        </button>
    );
};

export const CarouselPrevious = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    const { index, setIndex, count } = useCarousel();
    return (
        <button
            type="button"
            className={cn("ui-carousel__control", className)}
            onClick={(event) => {
                props.onClick?.(event);
                setIndex((index - 1 + Math.max(count, 1)) % Math.max(count, 1));
            }}
            {...props}
        >
            ‹
        </button>
    );
};
