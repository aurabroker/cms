<script lang="ts">
	import { articleThumbnail } from '$lib/youtube';
	import { formatDate } from '$lib/util';
	import type { Article } from '$lib/types';

	let { article }: { article: Partial<Article> } = $props();

	const thumb = $derived(articleThumbnail(article));
	const href = $derived(`/artykul/${article.slug || article.id}`);
	const tags = $derived(article.tags ?? []);
</script>

<a class="blog-card" {href}>
	{#if thumb}
		<div class="blog-card-thumb" style="background-image:url('{thumb}')">
			<div class="blog-card-thumb-overlay"></div>
		</div>
	{/if}
	<div class="blog-card-body">
		<div class="blog-card-tags">
			{#each tags.slice(0, 2) as tag}
				<span class="badge badge-primary">{tag}</span>
			{/each}
			{#if tags.length > 2}
				<span style="font-size:11px;color:var(--color-text-faint)">+{tags.length - 2}</span>
			{/if}
		</div>
		<div class="blog-card-title">{article.title}</div>
		<div class="blog-card-excerpt">{article.excerpt ?? ''}</div>
		<div class="blog-card-footer">
			<span>{formatDate(article.published_at)}</span>
			<span class="blog-card-cta">Czytaj →</span>
		</div>
	</div>
</a>
