import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, setHeaders, parent }) => {
	const { currentPlatform, currentPlatformLabel } = await parent();

	let query = locals.supabase
		.from('aura_articles')
		.select('id, title, excerpt, tags, published_at, thumbnail_url, preview_image_url, slug')
		.eq('status', 'published')
		.order('published_at', { ascending: false });

	if (currentPlatform) {
		query = query.contains('platforms', [currentPlatform]);
	}

	const { data, error } = await query;

	// Krótki cache na brzegu CDN — treść publiczna, odświeżana co minutę.
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60' });

	return {
		articles: data ?? [],
		platformLabel: currentPlatformLabel,
		loadError: error?.message ?? null
	};
};
