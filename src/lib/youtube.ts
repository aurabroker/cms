/** Narzędzia do wyciągania miniaturek / ID z linków YouTube. */

export function extractYouTubeId(url: string | null | undefined): string | null {
	if (!url) return null;
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
	];
	for (const re of patterns) {
		const m = url.match(re);
		if (m) return m[1];
	}
	return null;
}

export function youtubeThumbnail(url: string | null | undefined): string | null {
	const id = extractYouTubeId(url);
	return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
}

/** Miniaturka artykułu: najpierw z YouTube, potem własny obrazek podglądu. */
export function articleThumbnail(article: {
	thumbnail_url?: string | null;
	preview_image_url?: string | null;
}): string | null {
	return youtubeThumbnail(article.thumbnail_url) || article.preview_image_url || null;
}

/** Prosty slug z tytułu (PL znaki → ASCII), do SEO-friendly URLi. */
export function slugify(input: string): string {
	const map: Record<string, string> = {
		ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z'
	};
	return input
		.toLowerCase()
		.replace(/[ąćęłńóśźż]/g, (c) => map[c] || c)
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}
