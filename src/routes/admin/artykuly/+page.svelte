<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { Plus, Eye, Edit, EyeOff, Trash2 } from '@lucide/svelte';
	import PlatformBadge from '$components/PlatformBadge.svelte';
	import type { Platform } from '$lib/platforms';
	import { formatDate } from '$lib/util';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const platformList = $derived((page.data.platforms ?? []) as Platform[]);

	function applyFilters(patch: { status?: string; platform?: string }) {
		const params = new URLSearchParams();
		const status = patch.status ?? data.status;
		const platform = patch.platform ?? data.platform;
		if (status) params.set('status', status);
		if (platform) params.set('platform', platform);
		goto(`/admin/artykuly${params.toString() ? '?' + params : ''}`, { keepFocus: true });
	}
</script>

<svelte:head><title>Artykuły — AuraHUB CMS</title></svelte:head>

<div class="page-header">
	<div>
		<h1 class="page-title">Artykuły i Blogi</h1>
		<p class="page-subtitle">Zarządzaj wpisami na wszystkich prowadzonych stronach.</p>
	</div>
	<a href="/admin/artykuly/edytor" class="btn btn-primary" style="text-decoration:none">
		<Plus size={17} /> Nowy artykuł
	</a>
</div>

<div class="table-wrap">
	<div class="table-toolbar">
		<div style="display:flex;gap:8px;flex-wrap:wrap">
			<select
				class="form-select filter-select"
				value={data.platform}
				onchange={(e) => applyFilters({ platform: e.currentTarget.value })}
			>
				<option value="">Wszystkie platformy</option>
				{#each platformList as p}
					<option value={p.value}>{p.label}</option>
				{/each}
			</select>
			<select
				class="form-select filter-select"
				value={data.status}
				onchange={(e) => applyFilters({ status: e.currentTarget.value })}
			>
				<option value="">Wszystkie statusy</option>
				<option value="published">Opublikowane</option>
				<option value="draft">Szkice</option>
			</select>
		</div>
	</div>

	<table class="tbl">
		<thead>
			<tr>
				<th>Tytuł artykułu</th>
				<th>Platformy</th>
				<th>Status</th>
				<th>Data</th>
				<th>Akcje</th>
			</tr>
		</thead>
		<tbody>
			{#if data.loadError}
				<tr><td colspan="5" class="empty-state empty-state-error">Błąd: {data.loadError}</td></tr>
			{:else if data.articles.length === 0}
				<tr><td colspan="5" class="empty-state">Brak artykułów spełniających kryteria.</td></tr>
			{:else}
				{#each data.articles as art (art.id)}
					<tr>
						<td>
							<strong>{art.title}</strong><br />
							<span class="td-meta">
								{(art.excerpt ?? '').slice(0, 80)}{(art.excerpt ?? '').length > 80 ? '…' : ''}
							</span>
						</td>
						<td>{#each art.platforms ?? [] as p}<PlatformBadge value={p} />{' '}{/each}</td>
						<td>
							{#if art.status === 'published'}
								<span class="badge badge-success">Opublikowano</span>
							{:else}
								<span class="badge badge-muted">Szkic</span>
							{/if}
						</td>
						<td>{formatDate(art.created_at)}</td>
						<td class="td-actions">
							<a class="btn-icon" href={`/artykul/${art.slug || art.id}`} title="Podgląd" target="_blank" rel="noopener">
								<Eye size={15} />
							</a>
							<a class="btn-icon" href={`/admin/artykuly/edytor/${art.id}`} title="Edytuj">
								<Edit size={15} />
							</a>
							{#if art.status === 'published'}
								<form method="POST" action="?/unpublish" use:enhance style="display:inline">
									<input type="hidden" name="id" value={art.id} />
									<button class="btn-icon" title="Cofnij publikację"><EyeOff size={15} /></button>
								</form>
							{/if}
							<form
								method="POST"
								action="?/delete"
								use:enhance={({ cancel }) => {
									if (!confirm('Na pewno usunąć ten artykuł bezpowrotnie?')) cancel();
									return async ({ update }) => update();
								}}
								style="display:inline"
							>
								<input type="hidden" name="id" value={art.id} />
								<button class="btn-icon btn-icon-danger" title="Usuń"><Trash2 size={15} /></button>
							</form>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
