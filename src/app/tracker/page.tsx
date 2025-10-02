

import { Suspense } from "react";
import TrackerPage from "./TrackerPage";

export default function Page() {
    return (
        <Suspense fallback={<div />}>
            <TrackerPage />
        </Suspense>
    );
}
