import type { LayoutServerLoad } from './$types';
import { loadPlatforms } from '$lib/server/platforms';
import { resolvePlatform } from '$lib/platforms';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const platforms = await loadPlatforms(locals.supabase);
	const current = resolvePlatform(url.host, platforms);

	return {
		session: locals.session,
		role: locals.role,
		userEmail: locals.user?.email ?? null,
		platforms,
		currentPlatform: current?.value ?? null,
		currentPlatformLabel: current?.label ?? null
	};
};
