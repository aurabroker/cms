import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_PLATFORMS, type Platform } from '$lib/platforms';

/**
 * Ładuje aktywne platformy z bazy (`cms_platforms`) z krótkim cache w izolacie
 * (60 s), żeby nie odpytywać bazy przy każdym żądaniu. Fallback do listy
 * domyślnej, gdy baza jest nieosiągalna lub pusta.
 */
let cache: { at: number; list: Platform[] } | null = null;
const TTL = 60_000;

export async function loadPlatforms(supabase: SupabaseClient): Promise<Platform[]> {
	if (cache && Date.now() - cache.at < TTL) return cache.list;

	const { data, error } = await supabase
		.from('cms_platforms')
		.select('value, label, domain, color')
		.eq('active', true)
		.order('sort_order', { ascending: true });

	const list = !error && data && data.length ? (data as Platform[]) : DEFAULT_PLATFORMS;
	cache = { at: Date.now(), list };
	return list;
}
