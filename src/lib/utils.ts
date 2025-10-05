export type ClassValue = string | number | null | false | undefined | ClassValue[] | { [key: string]: boolean | string | number | undefined | null };

const toArray = (value: ClassValue): string[] => {
    if (!value) {
        return [];
    }
    if (typeof value === "string" || typeof value === "number") {
        return [String(value)];
    }
    if (Array.isArray(value)) {
        return value.flatMap(toArray);
    }
    return Object.entries(value)
        .filter(([, v]) => Boolean(v))
        .map(([key]) => key);
};

export const cn = (...values: ClassValue[]): string => {
    return values.flatMap(toArray).join(" ").trim();
};
