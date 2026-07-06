<script lang="ts">
	import { ArrowLeft } from '@lucide/svelte';
	import ThemeToggle from '$components/ThemeToggle.svelte';
	import { formatDateTime } from '$lib/util';
	import { articleThumbnail } from '$lib/youtube';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const a = $derived(data.article);
	const tags = $derived((a.tags ?? []) as string[]);
	const description = $derived((a.excerpt || a.title || '').slice(0, 160));
	const canonical = $derived(data.origin + data.canonicalPath);
	const ogImage = $derived(articleThumbnail(a));
	const isDraft = $derived(a.status !== 'published');
</script>

<svelte:head>
	<title>{a.title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={a.title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	{#if ogImage}<meta property="og:image" content={ogImage} />{/if}
	{#if a.published_at}<meta property="article:published_time" content={a.published_at} />{/if}
	<meta name="robots" content={isDraft ? 'noindex, nofollow' : 'index, follow'} />
</svelte:head>

<div class="public-shell">
	<header class="public-header">
		<a href="/" class="brand" style="text-decoration:none">
			<div class="brand-logo">A</div>
			<span>Aura<span class="brand-sub">HUB</span></span>
		</a>
		<div style="display:flex;align-items:center;gap:8px">
			<ThemeToggle />
			<a href="/" class="btn btn-ghost btn-sm" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px">
				<ArrowLeft size={15} /> Baza wiedzy
			</a>
		</div>
	</header>

	<main class="public-main" style="max-width:820px">
		{#if isDraft}
			<div class="badge badge-warning" style="margin-bottom:16px">Podgląd szkicu (niepublikowany)</div>
		{/if}
		<article class="article-reader-body" style="padding:0">
			<div class="article-tags">
				{#each tags as tag}
					<span class="article-tag">{tag}</span>
				{/each}
			</div>
			<h1 class="article-title">{a.title}</h1>
			<div class="article-date">
				Opublikowano: {formatDateTime(a.published_at || a.created_at)}
			</div>
			<!-- Treść pochodzi z edytora TipTap (schemat ograniczony, autorzy = tylko admini). -->
			<div class="prose-custom">{@html a.content}</div>
		</article>
	</main>

	<footer class="public-footer">© {new Date().getFullYear()} Aura Group</footer>
</div>
