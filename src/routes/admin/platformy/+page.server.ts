import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data, error } = await locals.supabase
		.from('cms_platforms')
		.select('*')
		.order('sort_order', { ascending: true });

	return { platforms: data ?? [], loadError: error?.message ?? null };
};

function normDomain(raw: string): string {
	return raw
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\//, '')
		.replace(/\/.*$/, '')
		.replace(/^www\./, '');
}

function normColor(raw: string): string {
	return /^#[0-9a-fA-F]{6}$/.test(raw.trim()) ? raw.trim() : '#475569';
}

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const f = await request.formData();
		const value = String(f.get('value') ?? '').trim();
		const label = String(f.get('label') ?? '').trim();
		const domain = normDomain(String(f.get('domain') ?? ''));
		const color = normColor(String(f.get('color') ?? ''));
		const sort_order = parseInt(String(f.get('sort_order') ?? '0'), 10) || 0;

		if (!value || !label || !domain) {
			return fail(400, { error: 'Wartość, etykieta i domena są wymagane.' });
		}

		const { error } = await locals.supabase
			.from('cms_platforms')
			.insert([{ value, label, domain, color, sort_order }]);
		if (error) {
			return fail(400, {
				error: error.code === '23505' ? `Platforma o wartości „${value}" już istnieje.` : error.message
			});
		}
		return { success: true };
	},

	update: async ({ request, locals }) => {
		const f = await request.formData();
		const id = String(f.get('id') ?? '');
		const label = String(f.get('label') ?? '').trim();
		const domain = normDomain(String(f.get('domain') ?? ''));
		const color = normColor(String(f.get('color') ?? ''));
		const sort_order = parseInt(String(f.get('sort_order') ?? '0'), 10) || 0;

		if (!label || !domain) return fail(400, { error: 'Etykieta i domena są wymagane.' });

		const { error } = await locals.supabase
			.from('cms_platforms')
			.update({ label, domain, color, sort_order })
			.eq('id', id);
		if (error) return fail(400, { error: error.message });
		return { success: true };
	},

	toggle: async ({ request, locals }) => {
		const f = await request.formData();
		const id = String(f.get('id') ?? '');
		const active = f.get('active') === 'true';
		const { error } = await locals.supabase.from('cms_platforms').update({ active }).eq('id', id);
		if (error) return fail(400, { error: error.message });
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const id = String((await request.formData()).get('id') ?? '');
		const { error } = await locals.supabase.from('cms_platforms').delete().eq('id', id);
		if (error) return fail(400, { error: error.message });
		return { success: true };
	}
};
