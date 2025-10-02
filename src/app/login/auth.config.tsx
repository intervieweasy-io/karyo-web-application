/* eslint-disable */

import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import type { ReactNode } from "react";

export type Mode = "login" | "signup" | "forgot";

export type FieldType = "text" | "email" | "password" | "checkbox";
export type Validator = (
    val: string,
    all: Record<string, string>,
    mode: Mode
) => string | "";

export type FieldConfig = {
    id: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    leading?: ReactNode;
    trailing?: (args: {
        id: string;
        isPasswordVisible: boolean;
        toggle: () => void;
    }) => ReactNode;
    required?: boolean;
    validate?: Validator[];
    renderAfter?: ReactNode;
};

export type ModeConfig = {
    title: string;
    subtitle: string;
    ctaLabel: string;
    fields: FieldConfig[];
};

const icon = {
    user: <User className="lead" />,
    mail: <Mail className="lead" />,
    lock: <Lock className="lead" />,
};

const passwordToggler =
    (label: string) =>
        ({ isPasswordVisible, toggle }: { isPasswordVisible: boolean; toggle: () => void }) =>
        (
            <button
                type="button"
                className="trailing action"
                onClick={toggle}
                aria-label={isPasswordVisible ? `Hide ${label}` : `Show ${label}`}
            >
                {isPasswordVisible ? <EyeOff /> : <Eye />}
            </button>
        );

const required: Validator = (v) => (!v ? "This field is required" : "");
const emailFormat: Validator = (v) =>
    v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email" : "";
const matchPwd: Validator = (_v, all) =>
    all.password !== all["confirm-password"] ? "Passwords don’t match" : "";
const mustAgree: Validator = (v) =>
    v === "true" ? "" : "Please accept the Terms & Privacy";

export const MODES: Record<Mode, ModeConfig> = {
    login: {
        title: "Welcome Back",
        subtitle: "Sign in to continue your journey",
        ctaLabel: "Sign In",
        fields: [
            {
                id: "email",
                label: "Email",
                type: "email",
                placeholder: "Enter your email",
                leading: icon.mail,
                validate: [required, emailFormat],
            },
            {
                id: "password",
                label: "Password",
                type: "password",
                placeholder: "Enter your password",
                leading: icon.lock,
                trailing: passwordToggler("password"),
                validate: [required],
            },
        ],
    },
    signup: {
        title: "Create Account",
        subtitle: "Join us and start your journey",
        ctaLabel: "Create Account",
        fields: [
            {
                id: "name",
                label: "Full Name",
                type: "text",
                placeholder: "Enter your name",
                leading: icon.user,
                validate: [required],
            },
            {
                id: "email",
                label: "Email",
                type: "email",
                placeholder: "Enter your email",
                leading: icon.mail,
                validate: [required, emailFormat],
            },
            {
                id: "password",
                label: "Password",
                type: "password",
                placeholder: "Enter password",
                leading: icon.lock,
                trailing: passwordToggler("password"),
                validate: [required],
            },
            {
                id: "confirm-password",
                label: "Confirm Password",
                type: "password",
                placeholder: "Re-enter password",
                leading: icon.lock,
                trailing: passwordToggler("confirm password"),
                validate: [required, matchPwd],
            },
            {
                id: "agree",
                label: "I agree to Terms & Privacy",
                type: "checkbox",
                renderAfter: (
                    <span>
                        I agree to the{" "}
                        <a href="/terms" className="link">
                            Terms
                        </a>{" "}
                        &{" "}
                        <a href="/privacy" className="link">
                            Privacy
                        </a>
                    </span>
                ),
                validate: [mustAgree],
            },
        ],
    },
};
