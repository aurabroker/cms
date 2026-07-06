<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { CheckCircle, EyeOff, Edit, Trash2 } from '@lucide/svelte';
	import { formatDate } from '$lib/util';
	import type { Review } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function stars(n: number): string {
		const r = Math.round(n);
		return '★'.repeat(r) + '☆'.repeat(Math.max(0, 5 - r));
	}

	function filterBy(status: string) {
		const params = new URLSearchParams();
		if (status) params.set('status', status);
		goto(`/admin/opinie/${data.table}${params.toString() ? '?' + params : ''}`, { keepFocus: true });
	}

	// Modal edycji
	let edit = $state<{ open: boolean; r: Review | null }>({ open: false, r: null });
	function openEdit(r: Review) {
		edit = { open: true, r: { ...r } };
	}
</script>

<svelte:head><title>Opinie — {data.meta.label} — AuraHUB CMS</title></svelte:head>

<div class="page-header">
	<div>
		<h1 class="page-title">Opinie — {data.meta.label}</h1>
		<p class="page-subtitle">Moderuj opinie — zatwierdź do publikacji, edytuj lub usuń.</p>
	</div>
</div>

<div class="reviews-stats">
	<div class="reviews-stat">
		<span class="reviews-stat-label">Łącznie</span>
		<span class="reviews-stat-value">{data.stats.total}</span>
	</div>
	<div class="reviews-stat">
		<span class="reviews-stat-label">Zatwierdzone</span>
		<span class="reviews-stat-value">{data.stats.approved}</span>
	</div>
	<div class="reviews-stat">
		<span class="reviews-stat-label">Oczekujące</span>
		<span class="reviews-stat-value">{data.stats.pending}</span>
	</div>
	<div class="reviews-stat">
		<span class="reviews-stat-label">Średnia ocena</span>
		<span class="reviews-stat-stars">{data.stats.avg ? stars(data.stats.avg) : ''}</span>
		<span class="reviews-stat-value">{data.stats.avg ? data.stats.avg.toFixed(1) + ' / 5' : '—'}</span>
	</div>
</div>

<div class="table-wrap">
	<div class="table-toolbar">
		<select class="form-select filter-select" value={data.filter} onchange={(e) => filterBy(e.currentTarget.value)}>
			<option value="">Wszystkie statusy</option>
			<option value="pending">Oczekujące</option>
			<option value="approved">Zatwierdzone</option>
		</select>
	</div>
	<table class="tbl tbl-reviews">
		<thead>
			<tr>
				<th>Imię / Miasto{data.meta.hasZawod ? ' / Zawód' : ''}</th>
				<th>Ocena</th>
				<th>Komentarz</th>
				<th>Platforma</th>
				<th>Data</th>
				<th>Status</th>
				<th>Akcje</th>
			</tr>
		</thead>
		<tbody>
			{#if data.loadError}
				<tr><td colspan="7" class="empty-state empty-state-error">Błąd: {data.loadError}</td></tr>
			{:else if data.reviews.length === 0}
				<tr><td colspan="7" class="empty-state">Brak opinii spełniających kryteria.</td></tr>
			{:else}
				{#each data.reviews as r (r.id)}
					<tr>
						<td>
							<strong>{r.name}</strong><br />
							<span class="td-meta">{r.city}{data.meta.hasZawod && r.zawod ? ' · ' + r.zawod : ''}</span>
						</td>
						<td style="color:var(--color-warning);letter-spacing:1px">{stars(r.rating)}</td>
						<td class="td-truncate" style="max-width:220px">{r.comment || '—'}</td>
						<td><span style="font-size:11px;font-family:monospace">{r.platform}</span></td>
						<td>{formatDate(r.created_at)}</td>
						<td>
							{#if r.approved}
								<span class="badge badge-success">Zatwierdzone</span>
							{:else}
								<span class="badge badge-warning">Oczekuje</span>
							{/if}
						</td>
						<td class="td-actions">
							<form method="POST" action="?/approve" use:enhance style="display:inline">
								<input type="hidden" name="id" value={r.id} />
								<input type="hidden" name="approved" value={(!r.approved).toString()} />
								<button class="btn-icon" title={r.approved ? 'Cofnij zatwierdzenie' : 'Zatwierdź i opublikuj'}>
									{#if r.approved}<EyeOff size={15} />{:else}<CheckCircle size={15} />{/if}
								</button>
							</form>
							<button class="btn-icon" title="Edytuj" onclick={() => openEdit(r)}><Edit size={15} /></button>
							<form
								method="POST"
								action="?/delete"
								use:enhance={({ cancel }) => {
									if (!confirm('Usunąć tę opinię bezpowrotnie?')) cancel();
									return async ({ update }) => update();
								}}
								style="display:inline"
							>
								<input type="hidden" name="id" value={r.id} />
								<button class="btn-icon btn-icon-danger" title="Usuń"><Trash2 size={15} /></button>
							</form>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<!-- Modal edycji opinii -->
{#if edit.open && edit.r}
	<div class="modal-overlay open" onclick={(e) => { if (e.target === e.currentTarget) edit.open = false; }} role="presentation">
		<div class="modal">
			<div class="modal-header"><h3>Edytuj opinię</h3></div>
			<form
				method="POST"
				action="?/edit"
				use:enhance={() => async ({ update, result }) => {
					await update();
					if (result.type === 'success') edit.open = false;
				}}
			>
				<div class="modal-body">
					<input type="hidden" name="id" value={edit.r.id} />
					<div class="form-field">
						<label class="form-label" for="er-name">Imię</label>
						<input id="er-name" class="form-input" name="name" bind:value={edit.r.name} required />
					</div>
					<div class="form-field">
						<label class="form-label" for="er-city">Miasto</label>
						<input id="er-city" class="form-input" name="city" bind:value={edit.r.city} required />
					</div>
					{#if data.meta.hasZawod}
						<div class="form-field">
							<label class="form-label" for="er-zawod">Zawód</label>
							<input id="er-zawod" class="form-input" name="zawod" value={edit.r.zawod ?? ''} />
						</div>
					{/if}
					<div class="form-field">
						<label class="form-label" for="er-rating">Ocena (1–5)</label>
						<select id="er-rating" class="form-select" name="rating" value={String(edit.r.rating)}>
							{#each [5, 4, 3, 2, 1] as n}<option value={n}>{n}</option>{/each}
						</select>
					</div>
					<div class="form-field">
						<label class="form-label" for="er-comment">Komentarz</label>
						<textarea id="er-comment" class="form-input" name="comment" rows="3">{edit.r.comment ?? ''}</textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-ghost" onclick={() => (edit.open = false)}>Anuluj</button>
					<button type="submit" class="btn btn-primary">Zapisz zmiany</button>
				</div>
			</form>
		</div>
	</div>
{/if}
