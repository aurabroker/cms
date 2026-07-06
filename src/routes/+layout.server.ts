import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		session: locals.session,
		role: locals.role,
		userEmail: locals.user?.email ?? null
	};
};
