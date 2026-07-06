<script lang="ts">
	import { PenTool, BarChart2 } from '@lucide/svelte';
	import { page } from '$app/state';
	import PlatformBadge from '$components/PlatformBadge.svelte';
	import { formatDate } from '$lib/util';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const platformCount = $derived(page.data.platforms?.length ?? 0);
</script>

<svelte:head><title>Pulpit — AuraHUB CMS</title></svelte:head>

<h1 class="page-title">Pulpit główny</h1>
<p class="page-subtitle">Przegląd aktywności w całym ekosystemie Aura.</p>

<div class="kpi-grid">
	<div class="kpi-card">
		<div class="kpi-label">Opublikowane artykuły</div>
		<div class="kpi-value">{data.publishedCount}</div>
		<div class="kpi-sub">Łącznie na wszystkich platformach</div>
	</div>
	<div class="kpi-card">
		<div class="kpi-label">Szkice</div>
		<div class="kpi-value">{data.draftCount}</div>
		<div class="kpi-sub">Nieopublikowane wpisy</div>
	</div>
	<div class="kpi-card">
		<div class="kpi-label">Aktywne platformy</div>
		<div class="kpi-value">{platformCount}</div>
		<div class="kpi-sub">AuraBenefits, Grupowe.pro i inne</div>
	</div>
	<div class="kpi-card">
		<div class="kpi-label">Wszystkie wpisy</div>
		<div class="kpi-value">{data.publishedCount + data.draftCount}</div>
		<div class="kpi-sub">Opublikowane + szkice</div>
	</div>
</div>

<div class="two-col-grid">
	<div class="table-wrap">
		<div class="table-toolbar">
			<h3 style="font-size:var(--text-base);margin:0">Ostatnie artykuły</h3>
			<a href="/admin/artykuly" class="btn btn-ghost btn-sm" style="text-decoration:none">Zobacz wszystkie</a>
		</div>
		<table class="tbl">
			<thead>
				<tr><th>Tytuł</th><th>Platformy</th><th>Status</th><th>Data</th></tr>
			</thead>
			<tbody>
				{#if data.recent.length === 0}
					<tr><td colspan="4" class="empty-state">Brak artykułów.</td></tr>
				{:else}
					{#each data.recent as art (art.id)}
						<tr>
							<td><strong>{art.title}</strong></td>
							<td>{#each art.platforms ?? [] as p}<PlatformBadge value={p} />{' '}{/each}</td>
							<td>
								{#if art.status === 'published'}
									<span class="badge badge-success">Opublikowano</span>
								{:else}
									<span class="badge badge-muted">Szkic</span>
								{/if}
							</td>
							<td>{formatDate(art.created_at)}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<div class="quick-actions-card">
		<h3 style="font-size:var(--text-base);margin-bottom:16px">Szybkie akcje</h3>
		<div style="display:flex;flex-direction:column;gap:10px">
			<a href="/admin/artykuly/edytor" class="btn btn-primary" style="justify-content:flex-start;text-decoration:none">
				<PenTool size={16} /> Napisz nowy artykuł
			</a>
			<a href="/admin/analityka" class="btn btn-ghost" style="justify-content:flex-start;text-decoration:none">
				<BarChart2 size={16} /> Zobacz analitykę
			</a>
		</div>
	</div>
</div>
