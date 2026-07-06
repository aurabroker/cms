import { loadPlatforms } from '$lib/server/platforms';
import { resolvePlatform } from '$lib/platforms';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url, setHeaders }) => {
	const platforms = await loadPlatforms(locals.supabase);
	const platformValue = resolvePlatform(url.host, platforms)?.value ?? null;

	let q = locals.supabase
		.from('aura_articles')
		.select('id, slug, published_at')
		.eq('status', 'published')
		.order('published_at', { ascending: false });

	if (platformValue) q = q.contains('platforms', [platformValue]);

	const { data } = await q;
	const origin = url.origin;

	const items = (data ?? [])
		.map((a: { id: string; slug: string | null; published_at: string | null }) => {
			const loc = `${origin}/artykul/${a.slug || a.id}`;
			const lastmod = a.published_at ? `<lastmod>${new Date(a.published_at).toISOString()}</lastmod>` : '';
			return `<url><loc>${loc}</loc>${lastmod}</url>`;
		})
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url>${items}</urlset>`;

	setHeaders({ 'content-type': 'application/xml', 'cache-control': 'public, s-maxage=3600' });
	return new Response(xml);
};
