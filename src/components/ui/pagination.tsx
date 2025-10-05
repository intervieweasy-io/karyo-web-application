"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
    page?: number;
    pageCount?: number;
    onPageChange?: (page: number) => void;
}

export const Pagination = ({ page = 1, pageCount = 1, onPageChange, className, ...props }: PaginationProps) => {
    const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
    return (
        <nav className={cn("ui-pagination", className)} aria-label="Pagination" {...props}>
            <button
                type="button"
                className="ui-pagination__control"
                onClick={() => onPageChange?.(Math.max(1, page - 1))}
                disabled={page <= 1}
            >
                Previous
            </button>
            <ul className="ui-pagination__list">
                {pages.map((value) => (
                    <li key={value}>
                        <button
                            type="button"
                            className={cn("ui-pagination__item", value === page && "is-active")}
                            onClick={() => onPageChange?.(value)}
                        >
                            {value}
                        </button>
                    </li>
                ))}
            </ul>
            <button
                type="button"
                className="ui-pagination__control"
                onClick={() => onPageChange?.(Math.min(pageCount, page + 1))}
                disabled={page >= pageCount}
            >
                Next
            </button>
        </nav>
    );
};
