"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Sparkles, Stars } from "lucide-react";
import { MODES, type Mode } from "./auth.config";
import { FieldRenderer } from "./FieldRenderer";
import { ErrorText } from "./ErrorText";
import "./login.css";

const cx = (...c: Array<string | false | null | undefined>) =>
    c.filter(Boolean).join(" ");

type AuthPageProps = {
    initialMode?: Mode;
};

export default function AuthPage({ initialMode = "login" }: AuthPageProps) {
    const [mode, setMode] = useState<Mode>("login");
    const [loading, setLoading] = useState(false);
    const [values, setValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPwd, setShowPwd] = useState<Record<string, boolean>>({});

    const config = MODES[mode];

    const validate = () => {
        const e: Record<string, string> = {};
        for (const f of config.fields) {
            const v = values[f.id] ?? "";
            if (f.validate) {
                for (const rule of f.validate) {
                    const msg = rule(v, values, mode);
                    if (msg) {
                        e[f.id] = msg;
                        break;
                    }
                }
            }
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const onSubmit = async (ev: FormEvent) => {
        ev.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            // TODO: hook up login/signup APIs
            console.log(mode, values);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="bg">
                <div className="orb a" />
                <div className="orb b" />
                <div className="orb c" />
                <div className="grid" />
            </div>

            <div className="center">
                <div className="stack">
                    {/* header */}
                    <div className="header">
                        <div className="brand">
                            <div className="brand-tile">
                                <Sparkles className="brand-ico" />
                            </div>
                            <div className="brand-star">
                                <Stars className="brand-star-ico" />
                            </div>
                        </div>
                        <h1 className="title gradient-text">{config.title}</h1>
                        <p className="muted">{config.subtitle}</p>
                    </div>

                    {/* card */}
                    <div className="card glass glow">
                        <form className="form" onSubmit={onSubmit} noValidate>
                            {config.fields.map((f) => (
                                <FieldRenderer
                                    key={f.id}
                                    f={f}
                                    value={values[f.id] ?? ""}
                                    onChange={(v) => setValues({ ...values, [f.id]: v })}
                                    error={errors[f.id]}
                                    show={showPwd[f.id] ?? false}
                                    toggle={() =>
                                        setShowPwd({ ...showPwd, [f.id]: !showPwd[f.id] })
                                    }
                                />
                            ))}

                            {Object.entries(errors).map(
                                ([id, msg]) =>
                                    !config.fields.find((f) => f.id === id) && (
                                        <ErrorText key={id} id={`${id}-err`}>
                                            {msg}
                                        </ErrorText>
                                    )
                            )}

                            <button
                                type="submit"
                                className={cx("btn primary press group")}
                                disabled={loading}
                                aria-busy={loading}
                            >
                                <span className="sheen" />
                                <span className="btn-label">
                                    {loading ? `${config.ctaLabel}...` : config.ctaLabel}
                                    <ArrowRight className="ml" />
                                </span>
                            </button>
                        </form>

                        {/* foot switch */}
                        <div className="foot">
                            <p className="muted">
                                {mode === "login" ? (
                                    <>
                                        Don&apos;t have an account?{" "}
                                        <button
                                            className="link strong"
                                            type="button"
                                            onClick={() => setMode("signup")}
                                        >
                                            Create one now
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{" "}
                                        <button
                                            className="link strong"
                                            type="button"
                                            onClick={() => setMode("login")}
                                        >
                                            Sign in
                                        </button>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
