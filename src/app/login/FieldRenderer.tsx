import type { FieldConfig } from "./auth.config";
import { ErrorText } from "./ErrorText"
import { ChangeEvent } from "react";

export function FieldRenderer({
    f,
    value,
    onChange,
    error,
    show,
    toggle,
}: {
    f: FieldConfig;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    show: boolean;
    toggle: () => void;
}) {
    if (f.type === "checkbox") {
        return (
            <div className="row small" style={{ justifyContent: "flex-start" }}>
                <label className="remember" htmlFor={f.id}>
                    <input
                        id={f.id}
                        type="checkbox"
                        checked={value === "true"}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            onChange(e.target.checked ? "true" : "false")
                        }
                    />
                    {f.renderAfter || <span>{f.label}</span>}
                </label>
                {error && <ErrorText id={`${f.id}-err`}>{error}</ErrorText>}
            </div>
        );
    }

    return (
        <div className="field">
            <label htmlFor={f.id} className="label">
                {f.label}
            </label>
            <div className="inputwrap">
                {f.leading}
                <input
                    id={f.id}
                    className="input with-trailing"
                    type={f.type === "password" ? (show ? "text" : "password") : f.type}
                    placeholder={f.placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${f.id}-err` : undefined}
                />
                {f.trailing && f.trailing({ id: f.id, isPasswordVisible: show, toggle })}
            </div>
            {error && <ErrorText id={`${f.id}-err`}>{error}</ErrorText>}
        </div>
    );
}
