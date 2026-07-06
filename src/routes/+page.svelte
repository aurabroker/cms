<script lang="ts">
	import { LogIn } from '@lucide/svelte';
	import BlogCard from '$components/BlogCard.svelte';
	import ThemeToggle from '$components/ThemeToggle.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const brandName = $derived(data.platform?.label ?? 'AuraHUB');
	const pageTitle = $derived(`Baza Wiedzy — ${brandName}`);
	const metaDesc = $derived(
		`Artykuły, porady i aktualności${data.platform ? ' — ' + data.platform.label : ''}. Baza wiedzy Aura Group.`
	);
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={metaDesc} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={metaDesc} />
	<meta property="og:type" content="website" />
	<meta name="robots" content="index, follow" />
</svelte:head>

<div class="public-shell">
	<header class="public-header">
		<a href="/" class="brand" style="text-decoration:none">
			<div class="brand-logo">A</div>
			<span>Aura<span class="brand-sub">HUB</span></span>
		</a>
		<div style="display:flex;align-items:center;gap:8px">
			<ThemeToggle />
			<a href="/admin" class="btn btn-ghost" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px">
				<LogIn size={16} /> Panel redaktora
			</a>
		</div>
	</header>

	<main class="public-main">
		<h1 class="page-title">Baza Wiedzy</h1>
		<p class="page-subtitle">
			Artykuły, porady i trendy{data.platform ? ` — ${data.platform.label}` : ''}.
		</p>

		{#if data.loadError}
			<div class="empty-state empty-state-error">Błąd połączenia z bazą danych.</div>
		{:else if data.articles.length === 0}
			<div class="empty-state">Brak opublikowanych artykułów.</div>
		{:else}
			<div class="blog-grid">
				{#each data.articles as article (article.id)}
					<BlogCard {article} />
				{/each}
			</div>
		{/if}
	</main>

	<footer class="public-footer">
		© {new Date().getFullYear()} Aura Group · {brandName}
	</footer>
</div>
