/** Drobne narzędzia współdzielone. */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
	return UUID_RE.test(value);
}

/** Data w polskim formacie (dd.mm.rrrr). */
export function formatDate(value: string | null | undefined): string {
	if (!value) return '';
	return new Date(value).toLocaleDateString('pl-PL');
}

export function formatDateTime(value: string | null | undefined): string {
	if (!value) return '';
	return new Date(value).toLocaleString('pl-PL');
}
