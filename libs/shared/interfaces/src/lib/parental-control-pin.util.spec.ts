import {
    DEFAULT_PARENTAL_CONTROL_PIN,
    DEFAULT_PARENTAL_CONTROL_PIN_HASH,
} from './settings.interface';
import {
    hashParentalControlPin,
    isValidParentalControlPin,
    verifyParentalControlPin,
} from './parental-control-pin.util';

describe('parental-control-pin.util', () => {
    describe('isValidParentalControlPin', () => {
        it('accepts 4 to 8 digit numeric PINs', () => {
            expect(isValidParentalControlPin('6699')).toBe(true);
            expect(isValidParentalControlPin('12345678')).toBe(true);
        });

        it('rejects PINs that are too short, too long, or non-numeric', () => {
            expect(isValidParentalControlPin('123')).toBe(false);
            expect(isValidParentalControlPin('123456789')).toBe(false);
            expect(isValidParentalControlPin('abcd')).toBe(false);
            expect(isValidParentalControlPin('')).toBe(false);
        });
    });

    describe('hashParentalControlPin / verifyParentalControlPin', () => {
        it('produces a verifiable hash', async () => {
            const hash = await hashParentalControlPin('1234');
            await expect(verifyParentalControlPin('1234', hash)).resolves.toBe(
                true
            );
            await expect(verifyParentalControlPin('4321', hash)).resolves.toBe(
                false
            );
        });

        it('treats a missing/empty stored hash as never matching', async () => {
            await expect(
                verifyParentalControlPin('1234', '')
            ).resolves.toBe(false);
            await expect(
                verifyParentalControlPin('1234', null)
            ).resolves.toBe(false);
            await expect(
                verifyParentalControlPin('1234', undefined)
            ).resolves.toBe(false);
        });

        it('matches the hardcoded default PIN hash — guards against the two drifting apart', async () => {
            const computed = await hashParentalControlPin(
                DEFAULT_PARENTAL_CONTROL_PIN
            );
            expect(computed).toBe(DEFAULT_PARENTAL_CONTROL_PIN_HASH);
        });
    });
});
