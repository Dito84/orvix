import { isAdultCategoryName } from './adult-category-detector.util';

describe('isAdultCategoryName', () => {
    it('matches common English and Spanish adult category names', () => {
        expect(isAdultCategoryName('US - ADULT')).toBe(true);
        expect(isAdultCategoryName('ES | ADULTOS XXX')).toBe(true);
        expect(isAdultCategoryName('UK +18')).toBe(true);
        expect(isAdultCategoryName('PARA ADULTOS')).toBe(true);
        expect(isAdultCategoryName('PORNO LATINO')).toBe(true);
    });

    it('matches accented Spanish variants regardless of accent marks', () => {
        expect(isAdultCategoryName('ERÓTICO')).toBe(true);
        expect(isAdultCategoryName('EROTICA')).toBe(true);
        expect(isAdultCategoryName('erótica')).toBe(true);
    });

    it('does not match unrelated category names', () => {
        expect(isAdultCategoryName('USA - SPORTS')).toBe(false);
        expect(isAdultCategoryName('PELÍCULAS ACCIÓN')).toBe(false);
        expect(isAdultCategoryName('KIDS CARTOONS')).toBe(false);
    });

    it('handles null/undefined/empty names', () => {
        expect(isAdultCategoryName(null)).toBe(false);
        expect(isAdultCategoryName(undefined)).toBe(false);
        expect(isAdultCategoryName('')).toBe(false);
    });

    it('respects a custom keyword list instead of the default', () => {
        expect(isAdultCategoryName('CUSTOM BLOCKED WORD', ['blocked'])).toBe(
            true
        );
        expect(isAdultCategoryName('US - ADULT', ['blocked'])).toBe(false);
    });
});
