/**
 * PIN hashing for parental control. The PIN is never persisted in plain
 * text — only this SHA-256 hex digest — so
 * `Settings.parentalControl.pinHash` can be safely stored and backed up
 * like any other setting.
 *
 * This is a basic deterrent against casual bypass (a child guessing or
 * reading the settings storage), not a cryptographic security boundary:
 * anyone with access to the settings storage and enough patience could
 * brute-force a short numeric PIN offline. That is an accepted trade-off
 * for a feature whose threat model is "don't make it trivially easy for a
 * kid to flip a toggle", not "protect this from a determined attacker".
 *
 * Runs in both the renderer (browser Web Crypto) and, if ever needed, a
 * Node context with `globalThis.crypto` available (Node 19+) — this file
 * intentionally has zero framework/runtime dependencies so it can be
 * imported from any layer of the app.
 */

const PIN_HASH_CONTEXT = 'iptvnator-parental-control-v1';

async function sha256Hex(input: string): Promise<string> {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

/** 4 to 8 digits — long enough to not be a single keypress, short enough to type on a remote. */
export function isValidParentalControlPin(pin: string): boolean {
    return /^\d{4,8}$/.test(pin);
}

export async function hashParentalControlPin(pin: string): Promise<string> {
    return sha256Hex(`${PIN_HASH_CONTEXT}:${pin}`);
}

export async function verifyParentalControlPin(
    pin: string,
    storedHash: string | undefined | null
): Promise<boolean> {
    if (!storedHash) {
        return false;
    }
    const candidate = await hashParentalControlPin(pin);
    return candidate === storedHash;
}
