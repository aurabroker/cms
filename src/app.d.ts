import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Platform } from '$lib/platforms';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
			role: string | null;
		}
		interface PageData {
			session?: Session | null;
			platforms?: Platform[];
			currentPlatform?: string | null;
		}
		// interface Error {}
		interface Platform {
			env?: Record<string, unknown>;
			context?: { waitUntil(promise: Promise<unknown>): void };
			caches?: CacheStorage;
		}
	}
}

export {};
