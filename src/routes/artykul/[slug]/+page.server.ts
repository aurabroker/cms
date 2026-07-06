import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isUuid } from '$lib/util';

export const load: PageServerLoad = async (event) => {
	const { params, locals, url, setHeaders } = event;
	const key = params.slug;
	const isAdmin = locals.role === 'admin';
	const { currentPlatform: platformValue } = await event.parent();

	let query = locals.supabase.from('aura_articles').select('*');
	query = isUuid(key) ? query.eq('id', key) : query.eq('slug', key);

	// Publiczny czytnik widzi tylko opublikowane artykuły z bieżącej domeny.
	// Admin może podejrzeć dowolny (również szkic).
	if (!isAdmin) {
		query = query.eq('status', 'published');
		if (platformValue) query = query.contains('platforms', [platformValue]);
	}

	const { data, error: dbErr } = await query.single();
	if (dbErr || !data) {
		throw error(404, 'Nie znaleziono artykułu.');
	}

	// Zwiększ licznik wyświetleń tylko dla publicznych wejść.
	if (!isAdmin) {
		const task = Promise.resolve(
			locals.supabase.rpc('increment_article_views', { article_id: data.id })
		);
		event.platform?.context?.waitUntil?.(task);
	}

	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60' });

	return {
		article: data,
		origin: url.origin,
		canonicalPath: `/artykul/${data.slug || data.id}`
	};
};
