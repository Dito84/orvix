import { DEFAULT_ADULT_CATEGORY_KEYWORDS } from './settings.interface';

/** Strips accents/diacritics and lowercases, so "Erótico" matches keyword "erotic" and vice versa. */
function normalizeForMatch(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

/**
 * True when `name` contains any of `keywords` as a substring, ignoring case
 * and accents. Used both by the always-on default that hides newly
 * imported adult categories (see `category.operations.ts`) and by the
 * "auto-hide adult categories" action in the category management dialog.
 *
 * This is a heuristic, not a guarantee: providers name categories however
 * they like, so this can both miss unusually named adult categories and,
 * more rarely, over-match a category that merely mentions a keyword in
 * another sense. It intentionally has no framework dependencies so it can
 * run in the Electron main process (plain Node) as well as the renderer.
 */
export function isAdultCategoryName(
    name: string | null | undefined,
    keywords: readonly string[] = DEFAULT_ADULT_CATEGORY_KEYWORDS
): boolean {
    if (!name) {
        return false;
    }
    const normalizedName = normalizeForMatch(name);
    return keywords.some((keyword) => {
        const normalizedKeyword = normalizeForMatch(keyword.trim());
        return (
            normalizedKeyword.length > 0 &&
            normalizedName.includes(normalizedKeyword)
        );
    });
}
