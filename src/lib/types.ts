/** Typy odwzorowujące tabele Supabase używane przez CMS. */

export interface Article {
	id: string;
	title: string;
	excerpt: string | null;
	content: string;
	status: 'draft' | 'published' | null;
	tags: string[] | null;
	platforms: string[] | null;
	thumbnail_url: string | null;
	preview_image_url: string | null;
	slug: string | null;
	source_title: string | null;
	source_url: string | null;
	ai_generated: boolean | null;
	views: number;
	published_at: string | null;
	created_at: string | null;
}

export interface Review {
	id: string;
	name: string;
	city: string;
	rating: number;
	comment: string | null;
	zawod?: string | null;
	platform: string;
	approved: boolean;
	created_at: string;
}

export interface Profile {
	id: string;
	full_name: string | null;
	firma: string | null;
	rola: string | null;
	aktywny: boolean | null;
	created_at: string | null;
}

export type ReviewTableKey = 'div_review' | 'ud_review' | 'aura_reviews';

export interface ReviewTableMeta {
	key: ReviewTableKey;
	label: string;
	/** Czy tabela ma kolumnę `zawod` (zawód klienta). */
	hasZawod: boolean;
	/** Ikona lucide dla nawigacji. */
	icon: string;
}

export const REVIEW_TABLES: Record<ReviewTableKey, ReviewTableMeta> = {
	div_review:   { key: 'div_review',   label: 'Kancelaria',    hasZawod: true,  icon: 'scale' },
	ud_review:    { key: 'ud_review',    label: 'UtrataDochodu', hasZawod: true,  icon: 'briefcase' },
	aura_reviews: { key: 'aura_reviews', label: 'Grupowe.pro',   hasZawod: false, icon: 'users-2' }
};

export const REVIEW_TABLE_KEYS = Object.keys(REVIEW_TABLES) as ReviewTableKey[];

export function isReviewTableKey(v: string): v is ReviewTableKey {
	return v === 'div_review' || v === 'ud_review' || v === 'aura_reviews';
}
