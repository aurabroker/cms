import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!params.id) {
		return { article: null };
	}

	const { data, error: dbErr } = await locals.supabase
		.from('aura_articles')
		.select('*')
		.eq('id', params.id)
		.single();

	if (dbErr || !data) {
		throw error(404, 'Nie znaleziono artykułu.');
	}

	return { article: data };
};
