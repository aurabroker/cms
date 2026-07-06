import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '$lib/config';

/** Tworzy serwerowy klient Supabase trzymający sesję w cookies (SSR). */
const supabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (
				cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]
			) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	/**
	 * Bezpieczne pobranie sesji: najpierw getSession() (z cookie), a potem
	 * getUser() weryfikuje token po stronie Supabase (chroni przed podrobionym
	 * cookie). Zwraca null/null, jeśli weryfikacja się nie powiedzie.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, user: null };

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) return { session: null, user: null };

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

/** Chroni /admin — wymaga zalogowania i roli `admin` w tabeli profiles. */
const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;
	event.locals.role = null;

	if (session && user) {
		const { data: profile } = await event.locals.supabase
			.from('profiles')
			.select('rola')
			.eq('id', user.id)
			.single();
		event.locals.role = profile?.rola ?? null;
	}

	if (event.url.pathname.startsWith('/admin') && event.locals.role !== 'admin') {
		const returnTo = encodeURIComponent(event.url.pathname + event.url.search);
		throw redirect(303, `/login?returnTo=${returnTo}`);
	}

	return resolve(event);
};

export const handle = sequence(supabase, authGuard);
