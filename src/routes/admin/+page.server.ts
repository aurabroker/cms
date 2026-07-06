import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [pub, draft, recent] = await Promise.all([
		locals.supabase
			.from('aura_articles')
			.select('id', { count: 'exact', head: true })
			.eq('status', 'published'),
		locals.supabase
			.from('aura_articles')
			.select('id', { count: 'exact', head: true })
			.eq('status', 'draft'),
		locals.supabase
			.from('aura_articles')
			.select('id, title, platforms, status, created_at, slug')
			.order('created_at', { ascending: false })
			.limit(5)
	]);

	return {
		publishedCount: pub.count ?? 0,
		draftCount: draft.count ?? 0,
		recent: recent.data ?? []
	};
};
