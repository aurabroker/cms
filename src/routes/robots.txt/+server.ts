import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /login

Sitemap: ${url.origin}/sitemap.xml
`;
	setHeaders({ 'content-type': 'text/plain', 'cache-control': 'public, s-maxage=3600' });
	return new Response(body);
};
