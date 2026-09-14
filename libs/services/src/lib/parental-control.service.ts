import { computed, inject, Injectable } from '@angular/core';
import {
    DEFAULT_PARENTAL_CONTROL_SETTINGS,
    hashParentalControlPin,
    ParentalControlSettings,
    verifyParentalControlPin,
} from '@iptvnator/shared/interfaces';
import { SettingsStore } from './settings-store.service';

/**
 * Thin, action-oriented wrapper around the `parentalControl` slice of
 * Settings. Owns the PIN hashing so callers (the settings section, the PIN
 * prompt dialog, the category management dialog) never handle a raw PIN
 * beyond the single form field the user typed it into.
 *
 * Note on what this does and doesn't guard: the always-on default that
 * hides adult categories the first time a playlist's categories are
 * imported (see `category.operations.ts`) does not go through this
 * service at all — it runs in the Electron main process, which has no
 * Angular DI. This service is only for the renderer-side PIN gate on
 * *revealing* categories again (the category management dialog) and for
 * the Parental Control settings section.
 */
@Injectable({ providedIn: 'root' })
export class ParentalControlService {
    private readonly settingsStore = inject(SettingsStore);

    private readonly settings = computed<ParentalControlSettings>(
        () =>
            this.settingsStore.parentalControl?.() ??
            DEFAULT_PARENTAL_CONTROL_SETTINGS
    );

    readonly isEnabled = computed(() => this.settings().enabled);
    readonly hasPin = computed(() => this.settings().pinHash.length > 0);
    readonly keywords = computed(() => this.settings().autoHideKeywords);

    /** Sets/replaces the PIN and turns parental control on. */
    async setPin(pin: string): Promise<void> {
        const pinHash = await hashParentalControlPin(pin);
        await this.settingsStore.updateSettings({
            parentalControl: {
                ...this.settings(),
                enabled: true,
                pinHash,
            },
        });
    }

    /**
     * Turns parental control off. Callers are expected to have verified the
     * PIN first via `verifyPin` — this method does not check it itself, so
     * it doubles as the escape hatch when no PIN was ever set.
     */
    async disable(): Promise<void> {
        await this.settingsStore.updateSettings({
            parentalControl: {
                ...this.settings(),
                enabled: false,
            },
        });
    }

    async verifyPin(pin: string): Promise<boolean> {
        return verifyParentalControlPin(pin, this.settings().pinHash);
    }

    async updateKeywords(keywords: string[]): Promise<void> {
        await this.settingsStore.updateSettings({
            parentalControl: {
                ...this.settings(),
                autoHideKeywords: keywords,
            },
        });
    }
}
