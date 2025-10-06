"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { STAGES } from "../data";

const chipPlaceholders = Array.from({ length: STAGES.length + 1 });

export const TrackerFilterSkeleton = () => (
    <>
        <div className="tracker-filter-buttons tracker-filter-buttons--loading" aria-hidden>
            {chipPlaceholders.map((_, index) => (
                <Skeleton key={`chip-${index}`} className="tracker-chip__skeleton" />
            ))}
        </div>
        <div className="tracker-utilities-wrapper tracker-utilities-wrapper--loading" aria-hidden>
            <Skeleton className="tracker-search__skeleton" />
            <div className="tracker-voice__skeleton">
                <Skeleton className="tracker-voice__button-skeleton" />
                <Skeleton className="tracker-voice__status-skeleton" />
            </div>
        </div>
    </>
);

export const TrackerBoardSkeleton = () => (
    <>
        <p className="tracker-visible-count tracker-visible-count--loading" aria-hidden>
            <Skeleton className="tracker-visible-count__skeleton" />
        </p>
        <section className="tracker-board tracker-board--loading" aria-hidden>
            {STAGES.map((stage) => (
                <section
                    key={stage.key}
                    className="stage-column stage-column--loading"
                    style={{
                        borderColor: stage.accent,
                        backgroundColor: stage.background,
                    }}
                >
                    <header className="stage-column__header stage-column__header--loading">
                        <div className="stage-column__title-group">
                            <Skeleton className="stage-column__label-skeleton" />
                            <Skeleton className="stage-column__description-skeleton" />
                        </div>
                        <Skeleton className="stage-column__count-skeleton" />
                    </header>
                    <div className="stage-column__content stage-column__content--loading">
                        {Array.from({ length: 3 }).map((_, cardIdx) => (
                            <Skeleton key={`${stage.key}-card-${cardIdx}`} className="stage-column__card-skeleton" />
                        ))}
                    </div>
                </section>
            ))}
        </section>
    </>
);

