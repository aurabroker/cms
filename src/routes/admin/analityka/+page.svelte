<script lang="ts">
	import PlatformBadge from '$components/PlatformBadge.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Analityka — AuraHUB CMS</title></svelte:head>

<h1 class="page-title">Analityka</h1>
<p class="page-subtitle">Najczęściej czytane artykuły w całym ekosystemie.</p>

<div class="table-wrap">
	<div class="table-toolbar">
		<h3 style="margin:0">Top artykuły wg wyświetleń</h3>
	</div>
	<table class="tbl">
		<thead>
			<tr>
				<th>Tytuł artykułu</th>
				<th>Platformy</th>
				<th style="text-align:right">Wyświetlenia</th>
				<th>Status</th>
			</tr>
		</thead>
		<tbody>
			{#if data.loadError}
				<tr><td colspan="4" class="empty-state empty-state-error">Błąd: {data.loadError}</td></tr>
			{:else if data.top.length === 0}
				<tr><td colspan="4" class="empty-state">Brak artykułów.</td></tr>
			{:else}
				{#each data.top as art (art.id)}
					<tr>
						<td><strong>{art.title}</strong></td>
						<td>{#each art.platforms ?? [] as p}<PlatformBadge value={p} />{' '}{/each}</td>
						<td style="text-align:right;font-weight:600">{(art.views ?? 0).toLocaleString('pl-PL')}</td>
						<td>
							{#if art.status === 'published'}
								<span class="badge badge-success">Opublikowano</span>
							{:else}
								<span class="badge badge-muted">Szkic</span>
							{/if}
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
