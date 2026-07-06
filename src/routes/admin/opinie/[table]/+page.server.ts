import { error, fail } from '@sveltejs/kit';
import { REVIEW_TABLES, isReviewTableKey } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	if (!isReviewTableKey(params.table)) {
		throw error(404, 'Nieznana tabela opinii.');
	}
	const table = params.table;
	const filter = url.searchParams.get('status') ?? '';

	let q = locals.supabase.from(table).select('*').order('created_at', { ascending: false });
	if (filter === 'approved') q = q.eq('approved', true);
	if (filter === 'pending') q = q.eq('approved', false);

	const { data, error: dbErr } = await q;
	const { data: allData } = await locals.supabase.from(table).select('rating, approved');

	const total = allData?.length ?? 0;
	const approved = allData?.filter((r) => r.approved).length ?? 0;
	const avg = total ? allData!.reduce((s, r) => s + (r.rating ?? 0), 0) / total : 0;

	return {
		table,
		meta: REVIEW_TABLES[table],
		reviews: data ?? [],
		filter,
		loadError: dbErr?.message ?? null,
		stats: { total, approved, pending: total - approved, avg }
	};
};

function tableOf(params: { table: string }) {
	if (!isReviewTableKey(params.table)) throw error(404, 'Nieznana tabela opinii.');
	return params.table;
}

export const actions: Actions = {
	approve: async ({ request, locals, params }) => {
		const table = tableOf(params);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const approved = form.get('approved') === 'true';
		const { error: e } = await locals.supabase.from(table).update({ approved }).eq('id', id);
		if (e) return fail(400, { error: e.message });
		return { success: true };
	},
	delete: async ({ request, locals, params }) => {
		const table = tableOf(params);
		const id = String((await request.formData()).get('id') ?? '');
		const { error: e } = await locals.supabase.from(table).delete().eq('id', id);
		if (e) return fail(400, { error: e.message });
		return { success: true };
	},
	edit: async ({ request, locals, params }) => {
		const table = tableOf(params);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const name = String(form.get('name') ?? '').trim();
		const city = String(form.get('city') ?? '').trim();
		const rating = parseInt(String(form.get('rating') ?? '5'), 10);
		const comment = String(form.get('comment') ?? '').trim() || null;

		if (!name || !city) return fail(400, { error: 'Imię i miasto są wymagane.' });

		const payload: Record<string, unknown> = { name, city, rating, comment };
		if (REVIEW_TABLES[table].hasZawod) {
			payload.zawod = String(form.get('zawod') ?? '').trim() || null;
		}

		const { error: e } = await locals.supabase.from(table).update(payload).eq('id', id);
		if (e) return fail(400, { error: e.message });
		return { success: true };
	}
};
