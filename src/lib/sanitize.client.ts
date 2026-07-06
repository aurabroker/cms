/**
 * Sanityzacja HTML po stronie klienta (DOMPurify) wykonywana PRZY ZAPISIE,
 * dzięki czemu w bazie ląduje już bezpieczna treść i publiczny czytnik (SSR)
 * może ją renderować bez sanitizera działającego na Cloudflare Workers.
 *
 * Import jest dynamiczny — DOMPurify wymaga `window`, więc ładujemy go dopiero
 * w przeglądarce (nie podczas SSR).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let purifier: any = null;

const ALLOWED_IFRAME = ['youtube.com', 'youtube-nocookie.com', 'youtu.be', 'vimeo.com'];

export async function sanitizeHtml(html: string): Promise<string> {
	if (!purifier) {
		const mod = await import('dompurify');
		purifier = mod.default;
		purifier.addHook('afterSanitizeAttributes', (node: Element) => {
			if (node.tagName === 'IFRAME') {
				const src = node.getAttribute('src') || '';
				if (!ALLOWED_IFRAME.some((d) => src.includes(d))) node.removeAttribute('src');
			}
		});
	}
	return purifier.sanitize(html, {
		ADD_TAGS: ['iframe'],
		ADD_ATTR: [
			'allow',
			'allowfullscreen',
			'frameborder',
			'scrolling',
			'target',
			'rel',
			'data-align',
			'colspan',
			'rowspan'
		]
	});
}
