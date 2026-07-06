import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data, error } = await locals.supabase
		.from('aura_articles')
		.select('id, title, platforms, status, views, slug')
		.order('views', { ascending: false })
		.limit(10);

	return { top: data ?? [], loadError: error?.message ?? null };
};
