import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    inject,
    signal,
    ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { ParentalControlService } from '@iptvnator/services';

export interface ParentalPinDialogData {
    /** i18n key shown above the PIN field to explain why it's being asked. */
    messageKey?: string;
}

/**
 * Small standalone dialog that asks for the parental control PIN and
 * verifies it via `ParentalControlService`. `afterClosed()` emits `true`
 * only when the PIN was correct — `false`/`undefined` for cancel or a
 * wrong PIN, so callers can treat both as "don't proceed" without
 * distinguishing them.
 */
@Component({
    selector: 'app-parental-pin-dialog',
    imports: [
        CommonModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        TranslatePipe,
    ],
    templateUrl: './parental-pin-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentalPinDialogComponent {
    private readonly dialogRef = inject(
        MatDialogRef<ParentalPinDialogComponent>
    );
    private readonly parentalControl = inject(ParentalControlService);
    readonly data = inject<ParentalPinDialogData | null>(MAT_DIALOG_DATA, {
        optional: true,
    }) ?? { messageKey: undefined };

    readonly isVerifying = signal(false);
    readonly hasError = signal(false);

    @ViewChild('pinInput') pinInput?: ElementRef<HTMLInputElement>;

    async confirm(): Promise<void> {
        const pin = this.pinInput?.nativeElement.value ?? '';
        if (!pin) {
            return;
        }
        this.isVerifying.set(true);
        const valid = await this.parentalControl.verifyPin(pin);
        this.isVerifying.set(false);
        if (valid) {
            this.dialogRef.close(true);
        } else {
            this.hasError.set(true);
            if (this.pinInput) {
                this.pinInput.nativeElement.value = '';
                this.pinInput.nativeElement.focus();
            }
        }
    }

    cancel(): void {
        this.dialogRef.close(false);
    }
}
