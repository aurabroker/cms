import type { LayoutServerLoad } from './$types';
import { REVIEW_TABLE_KEYS } from '$lib/types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const counts = await Promise.all(
		REVIEW_TABLE_KEYS.map((t) =>
			locals.supabase.from(t).select('id', { count: 'exact', head: true })
		)
	);

	return {
		reviewCounts: {
			div_review: counts[0].count ?? 0,
			ud_review: counts[1].count ?? 0,
			aura_reviews: counts[2].count ?? 0
		},
		userEmail: locals.user?.email ?? null
	};
};
