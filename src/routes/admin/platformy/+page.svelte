<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Edit, Trash2, Eye, EyeOff } from '@lucide/svelte';
	import { hexToRgba } from '$lib/platforms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface PlatformRow {
		id: string;
		value: string;
		label: string;
		domain: string;
		color: string;
		active: boolean;
		sort_order: number;
	}

	const emptyRow = (): PlatformRow => ({
		id: '',
		value: '',
		label: '',
		domain: '',
		color: '#475569',
		active: true,
		sort_order: (data.platforms.at(-1)?.sort_order ?? 0) + 10
	});

	let modal = $state<{ open: boolean; mode: 'create' | 'edit'; row: PlatformRow }>({
		open: false,
		mode: 'create',
		row: emptyRow()
	});

	function openCreate() {
		modal = { open: true, mode: 'create', row: emptyRow() };
	}
	function openEdit(p: PlatformRow) {
		modal = { open: true, mode: 'edit', row: { ...p } };
	}
</script>

<svelte:head><title>Platformy — AuraHUB CMS</title></svelte:head>

<div class="page-header">
	<div>
		<h1 class="page-title">Platformy</h1>
		<p class="page-subtitle">
			Dodawaj i edytuj domeny publikacji bez zmian w kodzie. Nowa platforma od razu
			pojawia się w edytorze, filtrach i na publicznym blogu (po podłączeniu domeny do Workera).
		</p>
	</div>
	<button class="btn btn-primary" onclick={openCreate}><Plus size={17} /> Nowa platforma</button>
</div>

<div class="table-wrap">
	<table class="tbl">
		<thead>
			<tr>
				<th>Kolejność</th>
				<th>Etykieta</th>
				<th>Wartość (tag w artykule)</th>
				<th>Domena</th>
				<th>Znacznik</th>
				<th>Status</th>
				<th>Akcje</th>
			</tr>
		</thead>
		<tbody>
			{#if data.loadError}
				<tr><td colspan="7" class="empty-state empty-state-error">Błąd: {data.loadError}</td></tr>
			{:else if data.platforms.length === 0}
				<tr><td colspan="7" class="empty-state">Brak platform.</td></tr>
			{:else}
				{#each data.platforms as p (p.id)}
					<tr>
						<td>{p.sort_order}</td>
						<td><strong>{p.label}</strong></td>
						<td><span style="font-size:12px;font-family:monospace">{p.value}</span></td>
						<td>{p.domain}</td>
						<td>
							<span class="domain-tag" style="background:{hexToRgba(p.color, 0.12)};color:{p.color}">
								{p.label}
							</span>
						</td>
						<td>
							{#if p.active}
								<span class="badge badge-success">Aktywna</span>
							{:else}
								<span class="badge badge-muted">Wyłączona</span>
							{/if}
						</td>
						<td class="td-actions">
							<form method="POST" action="?/toggle" use:enhance style="display:inline">
								<input type="hidden" name="id" value={p.id} />
								<input type="hidden" name="active" value={(!p.active).toString()} />
								<button class="btn-icon" title={p.active ? 'Wyłącz' : 'Włącz'}>
									{#if p.active}<EyeOff size={15} />{:else}<Eye size={15} />{/if}
								</button>
							</form>
							<button class="btn-icon" title="Edytuj" onclick={() => openEdit(p)}><Edit size={15} /></button>
							<form
								method="POST"
								action="?/delete"
								use:enhance={({ cancel }) => {
									if (!confirm(`Usunąć platformę „${p.label}"? Artykuły otagowane „${p.value}" pozostaną, ale stracą przypisanie.`))
										cancel();
									return async ({ update }) => update();
								}}
								style="display:inline"
							>
								<input type="hidden" name="id" value={p.id} />
								<button class="btn-icon btn-icon-danger" title="Usuń"><Trash2 size={15} /></button>
							</form>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<!-- Modal dodawania / edycji -->
{#if modal.open}
	<div class="modal-overlay open" onclick={(e) => { if (e.target === e.currentTarget) modal.open = false; }} role="presentation">
		<div class="modal">
			<div class="modal-header">
				<h3>{modal.mode === 'create' ? 'Nowa platforma' : 'Edytuj platformę'}</h3>
			</div>
			<form
				method="POST"
				action={modal.mode === 'create' ? '?/create' : '?/update'}
				use:enhance={() => async ({ update, result }) => {
					await update();
					if (result.type === 'success') modal.open = false;
				}}
			>
				<div class="modal-body">
					{#if modal.mode === 'edit'}
						<input type="hidden" name="id" value={modal.row.id} />
					{/if}

					<div class="form-field">
						<label class="form-label" for="pf-value">Wartość (tag zapisywany w artykule)</label>
						<input
							id="pf-value"
							class="form-input"
							name="value"
							value={modal.row.value}
							placeholder="np. Zarzad"
							disabled={modal.mode === 'edit'}
							required={modal.mode === 'create'}
						/>
						{#if modal.mode === 'edit'}
							<span class="td-meta">Wartości nie zmienia się po utworzeniu (jest zapisana w artykułach).</span>
						{/if}
					</div>

					<div class="form-field">
						<label class="form-label" for="pf-label">Etykieta (widoczna nazwa)</label>
						<input id="pf-label" class="form-input" name="label" bind:value={modal.row.label} placeholder="np. Zarząd" required />
					</div>

					<div class="form-field">
						<label class="form-label" for="pf-domain">Domena (bez https:// i www)</label>
						<input id="pf-domain" class="form-input" name="domain" bind:value={modal.row.domain} placeholder="np. zarzad.pl" required />
					</div>

					<div class="form-row" style="display:flex;gap:16px;flex-wrap:wrap">
						<div class="form-field" style="flex:1;min-width:140px">
							<label class="form-label" for="pf-color">Kolor znacznika</label>
							<div style="display:flex;align-items:center;gap:10px">
								<input id="pf-color" type="color" name="color" bind:value={modal.row.color} style="width:44px;height:34px;border:none;background:none;cursor:pointer" />
								<span
									class="domain-tag"
									style="background:{hexToRgba(modal.row.color, 0.12)};color:{modal.row.color}"
								>
									{modal.row.label || 'Podgląd'}
								</span>
							</div>
						</div>
						<div class="form-field" style="flex:1;min-width:140px">
							<label class="form-label" for="pf-sort">Kolejność</label>
							<input id="pf-sort" class="form-input" name="sort_order" type="number" bind:value={modal.row.sort_order} />
						</div>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-ghost" onclick={() => (modal.open = false)}>Anuluj</button>
					<button type="submit" class="btn btn-primary">
						{modal.mode === 'create' ? 'Dodaj platformę' : 'Zapisz zmiany'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
