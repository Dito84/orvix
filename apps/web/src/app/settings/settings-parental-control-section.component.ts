import { CommonModule } from '@angular/common';
import {
    Component,
    ElementRef,
    input,
    output,
    signal,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { DEFAULT_ADULT_CATEGORY_KEYWORDS } from '@iptvnator/shared/interfaces';
import type { ParentalControlSaveError } from './settings-parental-control.facade';

@Component({
    selector: 'app-settings-parental-control-section',
    imports: [
        CommonModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSlideToggleModule,
        TranslateModule,
    ],
    templateUrl: './settings-parental-control-section.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [':host { display: contents; }'],
})
export class SettingsParentalControlSectionComponent {
    readonly enabled = input.required<boolean>();
    readonly hasPin = input.required<boolean>();
    readonly keywordsText = input.required<string>();
    readonly isSaving = input(false);
    readonly saveError = input<ParentalControlSaveError>(null);
    readonly pinSavedJustNow = input(false);
    readonly keywordsSavedJustNow = input(false);

    readonly savePin = output<{
        currentPin: string;
        newPin: string;
        confirmPin: string;
    }>();
    readonly disable = output<string>();
    readonly saveKeywords = output<string>();
    readonly resetKeywords = output<void>();

    /**
     * Controlled draft for the keywords textarea, seeded from the input on
     * construction. Kept local so "Restore defaults" can update what's on
     * screen immediately instead of waiting for the round trip through the
     * facade/service/settings store.
     */
    readonly keywordsDraft = signal('');

    @ViewChild('currentPinInput')
    private readonly currentPinInput?: ElementRef<HTMLInputElement>;
    @ViewChild('newPinInput')
    private readonly newPinInput?: ElementRef<HTMLInputElement>;
    @ViewChild('confirmPinInput')
    private readonly confirmPinInput?: ElementRef<HTMLInputElement>;
    @ViewChild('disablePinInput')
    private readonly disablePinInput?: ElementRef<HTMLInputElement>;

    constructor() {
        this.keywordsDraft.set(this.keywordsText());
    }

    onSavePin(): void {
        const currentPin = this.currentPinInput?.nativeElement.value ?? '';
        const newPin = this.newPinInput?.nativeElement.value ?? '';
        const confirmPin = this.confirmPinInput?.nativeElement.value ?? '';
        this.savePin.emit({ currentPin, newPin, confirmPin });
        // Cleared optimistically: a wrong current PIN or a mismatch is rare
        // enough that re-typing all three on the rare failure is a fine
        // trade-off for never leaving a PIN sitting in a form field.
        this.clearPinInputs();
    }

    private clearPinInputs(): void {
        if (this.currentPinInput) this.currentPinInput.nativeElement.value = '';
        if (this.newPinInput) this.newPinInput.nativeElement.value = '';
        if (this.confirmPinInput)
            this.confirmPinInput.nativeElement.value = '';
    }

    onDisable(): void {
        const pin = this.disablePinInput?.nativeElement.value ?? '';
        this.disable.emit(pin);
        if (this.disablePinInput) this.disablePinInput.nativeElement.value = '';
    }

    onKeywordsInput(value: string): void {
        this.keywordsDraft.set(value);
    }

    onSaveKeywords(): void {
        this.saveKeywords.emit(this.keywordsDraft());
    }

    onResetKeywords(): void {
        this.keywordsDraft.set(DEFAULT_ADULT_CATEGORY_KEYWORDS.join('\n'));
        this.resetKeywords.emit();
    }
}
