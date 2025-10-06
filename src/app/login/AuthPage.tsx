"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Sparkles, Stars } from "lucide-react";
import { MODES, type Mode } from "./auth.config";
import { FieldRenderer } from "./FieldRenderer";
import { ErrorText } from "./ErrorText";
import { login, signup, forgot, errCode } from "@/services/auth.service";
import "./login.css";

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

type AuthPageProps = { initialMode?: Mode; onAuth?: (access?: string) => void; redirectTo?: string };

const apiByMode = (m: Mode) => (m === "login" ? "login" : m === "signup" ? "signup" : m === "forgot" ? "forgot" : "");

const errMsg = (code?: string) =>
    code === "invalid_credentials" || code === "invalid_input"
        ? "Invalid email or password"
        : code === "email_in_use"
            ? "Email already in use"
            : code === "invalid_or_expired"
                ? "Link invalid or expired"
                : "Something went wrong. Please try again.";

const AuthPage = ({ initialMode = "login", onAuth, redirectTo }: AuthPageProps) => {
    const router = useRouter();
    const qp = useSearchParams();
    const [mode, setMode] = useState<Mode>(initialMode);
    const [loading, setLoading] = useState(false);
    const [values, setValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formErr, setFormErr] = useState<string | null>(null);
    const [okMsg, setOkMsg] = useState<string | null>(null);
    const [showPwd, setShowPwd] = useState<Record<string, boolean>>({});
    const firstErrorRef = useRef<HTMLInputElement | null>(null);

    const config = MODES[mode];
    const target = redirectTo || qp.get("redirectTo") || "/";

    const validateField = (id: string, v: string) => {
        const f = config.fields.find((x) => x.id === id);
        if (!f?.validate) return "";
        for (const rule of f.validate) {
            const msg = rule(v, values, mode);
            if (msg) return msg;
        }
        return "";
    };

    const validateAll = () => {
        const e: Record<string, string> = {};
        for (const f of config.fields) {
            const v = values[f.id] ?? "";
            const msg = validateField(f.id, v);
            if (msg) e[f.id] = msg;
        }
        setErrors(e);
        return e;
    };

    const setField = (id: string, v: string) => {
        setValues((prev) => {
            const next = { ...prev, [id]: v };
            return next;
        });
        setErrors((prev) => {
            if (!prev[id]) return prev;
            const msg = validateField(id, v);
            const next = { ...prev };
            if (msg) next[id] = msg;
            else delete next[id];
            return next;
        });
    };

    const focusFirstError = () => {
        firstErrorRef.current?.focus();
    };

    useEffect(() => {
        setErrors({});
        setFormErr(null);
        setOkMsg(null);
        setValues({});
        setShowPwd({});
    }, [mode]);

    useEffect(() => {
        firstErrorRef.current = null;
    }, [errors]);

    const onSubmit = async (ev: FormEvent) => {
        ev.preventDefault();
        if (loading) return;
        const e = validateAll();
        if (Object.keys(e).length) {
            const first = config.fields.find((f) => e[f.id]);
            if (first) {
                const el = document.querySelector<HTMLInputElement>(`[name="${first.id}"]`);
                if (el) firstErrorRef.current = el;
                requestAnimationFrame(focusFirstError);
            }
            return;
        }

        setLoading(true);
        setFormErr(null);
        setOkMsg(null);

        try {
            const which = apiByMode(mode);

            if (which === "login") {
                const r = await login({ email: values.email, password: values.password });
                onAuth?.(r?.access);
                router.replace(target);
            } else if (which === "signup") {
                const r = await signup({ email: values.email, name: values.name, password: values.password });
                onAuth?.(r?.access);
                router.replace(target);
            } else if (which === "forgot") {
                await forgot({ email: values.email });
                setOkMsg("If that email exists, a reset link has been sent.");
            }
        } catch (e: unknown) {
            const code = errCode(e);
            if (code === "email_in_use" && mode === "signup") {
                setErrors((prev) => ({ ...prev, email: "Email already in use" }));
            } else if (code === "invalid_credentials" && mode === "login") {
                setErrors((prev) => ({ ...prev, password: "Incorrect password" }));
            }
            setFormErr(errMsg(code));
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

                    <div className="card glass glow">
                        <form className="form" onSubmit={onSubmit} noValidate>
                            {config.fields.map((f) => (
                                <FieldRenderer
                                    key={f.id}
                                    f={f}
                                    value={values[f.id] ?? ""}
                                    onChange={(v) => setField(f.id, v)}
                                    error={errors[f.id]}
                                    show={showPwd[f.id] ?? false}
                                    toggle={() => setShowPwd({ ...showPwd, [f.id]: !showPwd[f.id] })}
                                />
                            ))}

                            {formErr && <ErrorText id="form-err">{formErr}</ErrorText>}
                            {okMsg && (
                                <p className="oktext" role="status">
                                    {okMsg}
                                </p>
                            )}

                            <button
                                type="submit"
                                className={cx("btn primary press group")}
                                disabled={loading}
                                aria-busy={loading}
                            >
                                <span className="sheen" />
                                <span className="btn-label" aria-live="polite">
                                    {loading ? (
                                        <>
                                            <Loader2 aria-hidden className="btn-spinner" />
                                            {`${config.ctaLabel}...`}
                                        </>
                                    ) : (
                                        <>
                                            {config.ctaLabel}
                                            <ArrowRight className="ml" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>

                        <div className="foot">
                            <p className="muted">
                                {mode === "login" ? (
                                    <>
                                        Don&apos;t have an account?{" "}
                                        <button className="link strong" type="button" onClick={() => setMode("signup")}>
                                            Create one now
                                        </button>
                                    </>
                                ) : mode === "signup" ? (
                                    <>
                                        Already have an account?{" "}
                                        <button className="link strong" type="button" onClick={() => setMode("login")}>
                                            Sign in
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        Remembered your password?{" "}
                                        <button className="link strong" type="button" onClick={() => setMode("login")}>
                                            Sign in
                                        </button>
                                    </>
                                )}
                            </p>
                            {mode !== "forgot" && (
                                <p className="muted">
                                    <button className="link" type="button" onClick={() => setMode("forgot")}>
                                        Forgot password?
                                    </button>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
