/**
 * Definicja platform (domen) Aura Group.
 *
 * Źródłem prawdy jest tabela Supabase `cms_platforms` — platformy dodaje się
 * z panelu (/admin/platformy), bez zmian w kodzie. Poniższa lista DEFAULT_PLATFORMS
 * służy tylko jako awaryjny fallback (gdyby baza była nieosiągalna).
 */

export interface Platform {
	/** Wartość zapisywana w kolumnie aura_articles.platforms */
	value: string;
	/** Etykieta pokazywana w UI */
	label: string;
	/** Główna domena (bez www) — do mapowania Host → platforma i SEO */
	domain: string;
	/** Kolor znacznika (badge), hex — dzięki temu nowe platformy nie wymagają CSS */
	color: string;
}

export const DEFAULT_PLATFORMS: Platform[] = [
	{ value: 'AuraBenefits',       label: 'AuraBenefits',     domain: 'aurabenefits.pl',    color: '#6366f1' },
	{ value: 'AuraConsulting.pl',  label: 'AuraConsulting',   domain: 'auraconsulting.pl',  color: '#0f172a' },
	{ value: 'Grupowe.pro',        label: 'Grupowe.pro',      domain: 'grupowe.pro',        color: '#3b82f6' },
	{ value: 'UtrataDochodu.pl',   label: 'UtrataDochodu',    domain: 'utratadochodu.pl',   color: '#d97706' },
	{ value: 'Gwarancje.pro',      label: 'Gwarancje.pro',    domain: 'gwarancje.pro',      color: '#01696f' },
	{ value: 'Idzik.org.pl',       label: 'Idzik.org.pl',     domain: 'idzik.org.pl',       color: '#8b5cf6' },
	{ value: 'Zarzad',             label: 'Zarząd',           domain: 'zarzad.pl',          color: '#475569' }
];

function normalizeHost(host: string | null | undefined): string {
	if (!host) return '';
	return host.split(':')[0].toLowerCase().replace(/^www\./, '');
}

/** Ustala platformę na podstawie nagłówka Host (z listy z bazy). */
export function resolvePlatform(
	host: string | null | undefined,
	list: Platform[]
): Platform | null {
	const h = normalizeHost(host);
	if (!h) return null;
	return list.find((p) => normalizeHost(p.domain) === h) ?? null;
}

/** Znajduje platformę po wartości. */
export function findPlatform(
	value: string | null | undefined,
	list: Platform[]
): Platform | undefined {
	return value ? list.find((p) => p.value === value) : undefined;
}

/** Zamienia hex (#rrggbb / #rgb) na rgba() z podaną przezroczystością. */
export function hexToRgba(hex: string, alpha: number): string {
	const clean = (hex || '').replace('#', '');
	const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
	const r = parseInt(full.slice(0, 2), 16) || 0;
	const g = parseInt(full.slice(2, 4), 16) || 0;
	const b = parseInt(full.slice(4, 6), 16) || 0;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
