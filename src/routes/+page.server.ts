import type { PageServerLoad } from './$types';
import { platformByValue, platformFromHost } from '$lib/platforms';

export const load: PageServerLoad = async ({ locals, url, setHeaders }) => {
	const platformValue = platformFromHost(url.host);

	let query = locals.supabase
		.from('aura_articles')
		.select('id, title, excerpt, tags, published_at, thumbnail_url, preview_image_url, slug')
		.eq('status', 'published')
		.order('published_at', { ascending: false });

	if (platformValue) {
		query = query.contains('platforms', [platformValue]);
	}

	const { data, error } = await query;

	// Krótki cache na brzegu CDN — treść publiczna, odświeżana co minutę.
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60' });

	const platform = platformByValue(platformValue);

	return {
		articles: data ?? [],
		platform: platform ? { label: platform.label, domain: platform.domain } : null,
		loadError: error?.message ?? null
	};
};
