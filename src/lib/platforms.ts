/**
 * Pojedyncze źródło prawdy o platformach (domenach) Aura Group.
 *
 * Każdy artykuł ma tablicę `platforms` z wartościami `value`. Publiczny blog
 * jest wielodomenowy — serwer czyta nagłówek Host i po nim wybiera platformę,
 * a następnie pokazuje tylko artykuły otagowane tą platformą.
 */

export interface Platform {
	/** Wartość zapisywana w kolumnie aura_articles.platforms */
	value: string;
	/** Etykieta pokazywana w edytorze / panelu */
	label: string;
	/** Główna domena (bez www) — używana do SEO / Open Graph */
	domain: string;
	/** Klasa CSS znacznika domeny (badge) */
	cssClass: string;
}

export const PLATFORMS: Platform[] = [
	{ value: 'AuraBenefits',       label: 'AuraBenefits',     domain: 'aurabenefits.pl',      cssClass: 'd-benefits' },
	{ value: 'AuraConsulting.pl',  label: 'AuraConsulting',   domain: 'auraconsulting.pl',    cssClass: 'd-aura' },
	{ value: 'Grupowe.pro',        label: 'Grupowe.pro',      domain: 'grupowe.pro',          cssClass: 'd-grupowe' },
	{ value: 'UtrataDochodu.pl',   label: 'UtrataDochodu',    domain: 'utratadochodu.pl',     cssClass: 'd-utrata' },
	{ value: 'Gwarancje.pro',      label: 'Gwarancje.pro',    domain: 'gwarancje.pro',        cssClass: 'd-gwar' },
	{ value: 'Idzik.org.pl',       label: 'Idzik.org.pl',     domain: 'idzik.org.pl',         cssClass: 'd-idzik' },
	{ value: 'Zarzad',             label: 'Zarząd',           domain: 'zarzad.pl',            cssClass: 'd-zarzad' },
	{ value: 'RozwodWaw.pl',       label: 'Rozwód Warszawa',  domain: 'rozwod.waw.pl',        cssClass: 'd-rwaw' },
	{ value: 'RozwodTarchomin.pl', label: 'Rozwód Tarchomin', domain: 'rozwodtarchomin.pl',   cssClass: 'd-rtarch' },
	{ value: 'RozwodOchota.pl',    label: 'Rozwód Ochota',    domain: 'rozwodochota.pl',      cssClass: 'd-rochota' },
	{ value: 'RozwodZoliborz.pl',  label: 'Rozwód Żoliborz',  domain: 'rozwodzoliborz.pl',    cssClass: 'd-rzolibz' },
	{ value: 'RozwodBielany.pl',   label: 'Rozwód Bielany',   domain: 'rozwodbielany.pl',     cssClass: 'd-rbielan' },
	{ value: 'RozwodLegionowo.pl', label: 'Rozwód Legionowo', domain: 'rozwodlegionowo.pl',   cssClass: 'd-rlegion' },
	{ value: 'RozwodMokotow.pl',   label: 'Rozwód Mokotów',   domain: 'rozwodmokotow.pl',     cssClass: 'd-rmokot' },
	{ value: 'RozwodLomianki.pl',  label: 'Rozwód Łomianki',  domain: 'rozwodlomianki.pl',    cssClass: 'd-rlomian' },
	{ value: 'RozwodWola.pl',      label: 'Rozwód Wola',      domain: 'rozwodwola.pl',        cssClass: 'd-rwola' },
	{ value: 'RozwodBemowo.pl',    label: 'Rozwód Bemowo',    domain: 'rozwodbemowo.pl',      cssClass: 'd-rbemowo' },
	{ value: 'RozwodJablonna.pl',  label: 'Rozwód Jabłonna',  domain: 'rozwodjablonna.pl',    cssClass: 'd-rjablon' }
];

/** Mapa: dokładny hostname (z www i bez) → wartość platformy. */
export const HOSTNAME_TO_PLATFORM: Record<string, string> = (() => {
	const map: Record<string, string> = {};
	for (const p of PLATFORMS) {
		map[p.domain] = p.value;
		map[`www.${p.domain}`] = p.value;
	}
	return map;
})();

const BY_VALUE = new Map(PLATFORMS.map((p) => [p.value, p]));

/** Zwraca definicję platformy po wartości z bazy (lub undefined). */
export function platformByValue(value: string | null | undefined): Platform | undefined {
	return value ? BY_VALUE.get(value) : undefined;
}

/**
 * Ustala platformę na podstawie nagłówka Host żądania.
 * Zwraca `null` dla nieznanych hostów (np. domena panelu, localhost) — wtedy
 * blog pokazuje wszystkie opublikowane artykuły (jak w starym app.js).
 */
export function platformFromHost(host: string | null | undefined): string | null {
	if (!host) return null;
	const hostname = host.split(':')[0].toLowerCase();
	return HOSTNAME_TO_PLATFORM[hostname] ?? null;
}
