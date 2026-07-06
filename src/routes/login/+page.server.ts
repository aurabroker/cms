import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function safeReturn(target: string | null): string {
	return target && target.startsWith('/') ? target : '/admin';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.role === 'admin') {
		throw redirect(303, safeReturn(url.searchParams.get('returnTo')));
	}
	return { returnTo: safeReturn(url.searchParams.get('returnTo')) };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const email = String(form.get('email') || '').trim();
		const password = String(form.get('password') || '');
		const returnTo = safeReturn(String(form.get('returnTo') || '/admin'));

		if (!email || !password) {
			return fail(400, { error: 'Podaj e-mail i hasło.', email });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({ email, password });
		if (error) {
			return fail(400, { error: 'Błąd logowania: ' + error.message, email });
		}

		const {
			data: { user }
		} = await locals.supabase.auth.getUser();

		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('rola')
			.eq('id', user?.id ?? '')
			.single();

		if (profile?.rola !== 'admin') {
			await locals.supabase.auth.signOut();
			return fail(403, { error: 'To konto nie ma uprawnień redaktora.', email });
		}

		throw redirect(303, returnTo);
	}
};
