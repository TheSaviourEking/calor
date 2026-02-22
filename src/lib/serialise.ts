// src/lib/serialise.ts

/**
 * Recursively replaces Date instances with ISO 8601 strings throughout an object.
 *
 * WHY THIS EXISTS: Next.js cannot pass Date objects as props from a Server Component
 * to a Client Component. Call serialise() on every Prisma result before passing it
 * across the server/client boundary.
 *
 * The mapped return type Serialised<T> accurately reflects the transformation —
 * callers receive string where Date was, not Date. No type assertions needed.
 */
export type Serialised<T> =
    T extends Date
    ? string
    : T extends Array<infer U>
    ? Serialised<U>[]
    : T extends object
    ? { [K in keyof T]: Serialised<T[K]> }
    : T

export function serialise<T>(value: T): Serialised<T> {
    if (value instanceof Date) {
        return value.toISOString() as Serialised<T>
    }
    if (Array.isArray(value)) {
        return value.map(serialise) as Serialised<T>
    }
    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, serialise(v)])
        ) as Serialised<T>
    }
    return value as Serialised<T>
}
