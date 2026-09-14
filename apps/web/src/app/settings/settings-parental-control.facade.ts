import { computed, inject, Injectable, signal } from '@angular/core';
import {
    DEFAULT_ADULT_CATEGORY_KEYWORDS,
    isValidParentalControlPin,
} from '@iptvnator/shared/interfaces';
import { ParentalControlService } from '@iptvnator/services';

export type ParentalControlSaveError =
    | 'invalid'
    | 'mismatch'
    | 'wrong-current'
    | null;

/**
 * Owns the Parental Control section's actions. Deliberately outside the
 * main settings reactive form (see `SettingsFormFacade`): the PIN is never
 * round-tripped as a plain form value — every change goes through
 * `ParentalControlService`, which hashes it — and each action (set PIN,
 * disable, save keywords) applies immediately rather than waiting for the
 * page-level Save button, the same way the Backup and Reset sections work.
 */
@Injectable()
export class SettingsParentalControlFacade {
    private readonly parentalControl = inject(ParentalControlService);

    readonly enabled = this.parentalControl.isEnabled;
    readonly hasPin = this.parentalControl.hasPin;
    readonly keywordsText = computed(() =>
        this.parentalControl.keywords().join('\n')
    );

    readonly isSaving = signal(false);
    readonly saveError = signal<ParentalControlSaveError>(null);
    readonly pinSavedJustNow = signal(false);
    readonly keywordsSavedJustNow = signal(false);

    async savePin(
        currentPin: string,
        newPin: string,
        confirmPin: string
    ): Promise<void> {
        this.saveError.set(null);

        if (this.hasPin()) {
            const currentOk = await this.parentalControl.verifyPin(
                currentPin
            );
            if (!currentOk) {
                this.saveError.set('wrong-current');
                return;
            }
        }

        if (!isValidParentalControlPin(newPin)) {
            this.saveError.set('invalid');
            return;
        }

        if (newPin !== confirmPin) {
            this.saveError.set('mismatch');
            return;
        }

        this.isSaving.set(true);
        try {
            await this.parentalControl.setPin(newPin);
            this.pinSavedJustNow.set(true);
            setTimeout(() => this.pinSavedJustNow.set(false), 3000);
        } finally {
            this.isSaving.set(false);
        }
    }

    /** Returns false (and sets saveError) when the current PIN is wrong, so
     *  the section can keep the toggle in sync without a separate signal. */
    async disable(currentPin: string): Promise<boolean> {
        this.saveError.set(null);
        const ok = await this.parentalControl.verifyPin(currentPin);
        if (!ok) {
            this.saveError.set('wrong-current');
            return false;
        }
        await this.parentalControl.disable();
        return true;
    }

    async saveKeywords(rawText: string): Promise<void> {
        const keywords = rawText
            .split('\n')
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword.length > 0);
        await this.parentalControl.updateKeywords(keywords);
        this.keywordsSavedJustNow.set(true);
        setTimeout(() => this.keywordsSavedJustNow.set(false), 3000);
    }

    async resetKeywordsToDefault(): Promise<void> {
        await this.parentalControl.updateKeywords([
            ...DEFAULT_ADULT_CATEGORY_KEYWORDS,
        ]);
    }
}
