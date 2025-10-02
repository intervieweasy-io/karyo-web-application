

import { Suspense } from "react";

export default function Page() {
    return (
        <Suspense fallback={<div />}>
            <div>Tracker</div>
        </Suspense>
    );
}
