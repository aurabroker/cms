import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const status = url.searchParams.get('status') ?? '';
	const platform = url.searchParams.get('platform') ?? '';

	let q = locals.supabase
		.from('aura_articles')
		.select('*')
		.order('created_at', { ascending: false });

	if (status) q = q.eq('status', status);
	if (platform) q = q.contains('platforms', [platform]);

	const { data, error } = await q;

	return {
		articles: data ?? [],
		status,
		platform,
		loadError: error?.message ?? null
	};
};

export const actions: Actions = {
	unpublish: async ({ request, locals }) => {
		const id = String((await request.formData()).get('id') ?? '');
		const { error } = await locals.supabase
			.from('aura_articles')
			.update({ status: 'draft' })
			.eq('id', id);
		if (error) return fail(400, { error: error.message });
		return { success: true };
	},
	delete: async ({ request, locals }) => {
		const id = String((await request.formData()).get('id') ?? '');
		const { error } = await locals.supabase.from('aura_articles').delete().eq('id', id);
		if (error) return fail(400, { error: error.message });
		return { success: true };
	}
};
