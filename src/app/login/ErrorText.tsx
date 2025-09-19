import { type ReactNode } from "react";

export function ErrorText({ id, children }: { id: string; children: ReactNode }) {
    return (
        <div id={id} role="alert" style={{ color: "#ffb4b4", fontSize: ".85rem" }}>
            {children}
        </div>
    );
}
