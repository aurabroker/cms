<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { X, Save, Send } from '@lucide/svelte';
	import Editor from '$components/Editor.svelte';
	import { PLATFORMS } from '$lib/platforms';
	import { supabaseBrowser } from '$lib/supabaseClient';
	import { STORAGE_BUCKET } from '$lib/config';
	import { sanitizeHtml } from '$lib/sanitize.client';
	import { youtubeThumbnail, slugify } from '$lib/youtube';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const article = data.article;

	let articleId = $state<string | null>(article?.id ?? null);
	let title = $state(article?.title ?? '');
	let excerpt = $state(article?.excerpt ?? '');
	let tagsStr = $state((article?.tags ?? []).join(', '));
	let slug = $state(article?.slug ?? '');
	let thumbnail = $state(article?.thumbnail_url ?? '');
	let previewImageUrl = $state(article?.preview_image_url ?? '');

	const platforms = $state<Record<string, boolean>>(
		Object.fromEntries(
			PLATFORMS.map((p) => [
				p.value,
				article ? (article.platforms ?? []).includes(p.value) : p.value === 'AuraBenefits'
			])
		)
	);

	let dirty = $state(false);
	let saving = $state(false);
	let editorRef: Editor;
	let previewFileInput: HTMLInputElement;

	let status = $state<{ state: 'saving' | 'saved' | 'error'; text: string; visible: boolean }>({
		state: 'saved',
		text: '',
		visible: false
	});
	let statusTimer: ReturnType<typeof setTimeout>;
	function setStatus(state: 'saving' | 'saved' | 'error', text: string, hideAfter = 0) {
		clearTimeout(statusTimer);
		status = { state, text, visible: true };
		if (hideAfter) statusTimer = setTimeout(() => (status = { ...status, visible: false }), hideAfter);
	}

	const thumbPreview = $derived(youtubeThumbnail(thumbnail));

	function markDirty() {
		dirty = true;
	}

	// ── Upload zdjęć do Supabase Storage ──────────────────────────────────────
	async function uploadImage(file: File): Promise<string | null> {
		const ext =
			(file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
		const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}.${ext}`;
		setStatus('saving', 'Wgrywanie zdjęcia...');
		const { error } = await supabaseBrowser.storage
			.from(STORAGE_BUCKET)
			.upload(filename, file, { contentType: file.type, upsert: false });
		if (error) {
			setStatus('error', '⚠ Błąd uploadu: ' + error.message, 4000);
			return null;
		}
		const {
			data: { publicUrl }
		} = supabaseBrowser.storage.from(STORAGE_BUCKET).getPublicUrl(filename);
		setStatus('saved', '✓ Zdjęcie wgrane', 2000);
		return publicUrl;
	}

	async function onPreviewImagePicked() {
		const file = previewFileInput.files?.[0];
		if (!file) return;
		const url = await uploadImage(file);
		if (url) {
			previewImageUrl = url;
			markDirty();
		}
	}

	// ── Zapis ─────────────────────────────────────────────────────────────────
	function selectedPlatforms(): string[] {
		return PLATFORMS.filter((p) => platforms[p.value]).map((p) => p.value);
	}

	async function buildPayload(desiredStatus?: 'draft' | 'published') {
		const content = await sanitizeHtml(editorRef.getHTML());
		const tags = tagsStr
			.split(',')
			.map((t: string) => t.trim())
			.filter(Boolean);
		const finalSlug = (slug.trim() || slugify(title)) || null;
		const payload: Record<string, unknown> = {
			title: title.trim(),
			excerpt: excerpt.trim(),
			content,
			tags,
			platforms: selectedPlatforms(),
			thumbnail_url: thumbnail.trim() || null,
			preview_image_url: previewImageUrl.trim() || null,
			slug: finalSlug
		};
		if (desiredStatus) {
			payload.status = desiredStatus;
			payload.ai_generated = false;
			if (desiredStatus === 'published') payload.published_at = new Date().toISOString();
		}
		return payload;
	}

	async function save(desiredStatus: 'draft' | 'published') {
		if (!selectedPlatforms().length) {
			alert('Wybierz przynajmniej jedno miejsce publikacji.');
			return;
		}
		if (!title.trim()) {
			alert('Podaj tytuł artykułu.');
			return;
		}
		if (editorRef.isEmpty()) {
			alert('Artykuł nie może być pusty.');
			return;
		}

		saving = true;
		const payload = await buildPayload(desiredStatus);
		const res = articleId
			? await supabaseBrowser.from('aura_articles').update(payload).eq('id', articleId)
			: await supabaseBrowser.from('aura_articles').insert([payload]);
		saving = false;

		if (res.error) {
			alert('Błąd zapisu: ' + res.error.message);
			return;
		}
		dirty = false;
		stopAutosave();
		goto('/admin/artykuly');
	}

	function cancel() {
		if (dirty && !confirm('Masz niezapisane zmiany. Na pewno zamknąć?')) return;
		stopAutosave();
		goto('/admin/artykuly');
	}

	// ── Autozapis (co 30 s) — tylko dla istniejących artykułów ────────────────
	let autosaveTimer: ReturnType<typeof setInterval> | null = null;
	function startAutosave() {
		stopAutosave();
		autosaveTimer = setInterval(runAutosave, 30000);
	}
	function stopAutosave() {
		if (autosaveTimer) clearInterval(autosaveTimer);
		autosaveTimer = null;
	}
	async function runAutosave() {
		if (!dirty || !articleId || !title.trim()) return;
		setStatus('saving', 'Automatyczne zapisywanie...');
		const payload = await buildPayload();
		const { error } = await supabaseBrowser
			.from('aura_articles')
			.update(payload)
			.eq('id', articleId);
		if (error) {
			setStatus('error', '⚠ Błąd auto-zapisu', 4000);
		} else {
			dirty = false;
			setStatus('saved', '✓ Automatycznie zapisano', 3000);
		}
	}

	function beforeUnload(e: BeforeUnloadEvent) {
		if (dirty) {
			e.preventDefault();
			e.returnValue = '';
		}
	}

	onMount(() => {
		startAutosave();
		window.addEventListener('beforeunload', beforeUnload);
	});
	onDestroy(() => {
		stopAutosave();
		if (typeof window !== 'undefined') window.removeEventListener('beforeunload', beforeUnload);
	});
</script>

<svelte:head><title>{articleId ? 'Edycja artykułu' : 'Nowy artykuł'} — AuraHUB CMS</title></svelte:head>

<div class="page-header">
	<div>
		<h1 class="page-title">{articleId ? 'Edycja artykułu' : 'Nowy artykuł'}</h1>
		<p class="page-subtitle">
			{#if status.visible}
				<span class="autosave-indicator {status.state}">{status.text}</span>
			{:else}
				Uzupełnij treść i wskaż platformy publikacji.
			{/if}
		</p>
	</div>
	<div style="display:flex;gap:8px;flex-wrap:wrap">
		<button class="btn btn-ghost" onclick={cancel}><X size={16} /> Anuluj</button>
		<button class="btn btn-ghost btn-save-draft" onclick={() => save('draft')} disabled={saving}>
			<Save size={16} /> Zapisz szkic
		</button>
		<button class="btn btn-primary" onclick={() => save('published')} disabled={saving}>
			<Send size={16} /> Opublikuj
		</button>
	</div>
</div>

<div class="form-field">
	<label class="form-label" for="a-title">Tytuł artykułu</label>
	<input id="a-title" class="form-input" bind:value={title} oninput={markDirty} placeholder="Wpisz tytuł…" />
</div>

<div class="form-row" style="display:flex;gap:16px;flex-wrap:wrap">
	<div class="form-field" style="flex:1;min-width:240px">
		<label class="form-label" for="a-slug">Slug (adres URL) — opcjonalny</label>
		<input id="a-slug" class="form-input" bind:value={slug} oninput={markDirty} placeholder="np. benefity-2026 (auto z tytułu)" />
	</div>
	<div class="form-field" style="flex:1;min-width:240px">
		<label class="form-label" for="a-tags">Tagi (po przecinku)</label>
		<input id="a-tags" class="form-input" bind:value={tagsStr} oninput={markDirty} placeholder="HR, benefity, prawo" />
	</div>
</div>

<div class="form-field">
	<label class="form-label" for="a-excerpt">Zajawka / wstęp</label>
	<textarea id="a-excerpt" class="form-input" rows="2" bind:value={excerpt} oninput={markDirty} placeholder="Krótki opis widoczny na liście i w SEO…"></textarea>
</div>

<div class="form-field">
	<span class="form-label">Miejsca publikacji</span>
	<div style="display:flex;flex-wrap:wrap;gap:10px 18px;margin-top:6px">
		{#each PLATFORMS as p}
			<label style="display:flex;align-items:center;gap:6px;font-size:var(--text-sm)">
				<input type="checkbox" bind:checked={platforms[p.value]} onchange={markDirty} />
				{p.label}
			</label>
		{/each}
	</div>
</div>

<div class="form-row" style="display:flex;gap:16px;flex-wrap:wrap">
	<div class="form-field" style="flex:1;min-width:240px">
		<label class="form-label" for="a-thumb">Link YouTube (miniaturka)</label>
		<input id="a-thumb" class="form-input" bind:value={thumbnail} oninput={markDirty} placeholder="https://youtu.be/…" />
		{#if thumbPreview}
			<div style="margin-top:8px;height:120px;border-radius:var(--radius-md);background-size:cover;background-position:center;background-image:url('{thumbPreview}')"></div>
		{/if}
	</div>
	<div class="form-field" style="flex:1;min-width:240px">
		<span class="form-label">Własny obrazek podglądu</span>
		<div style="display:flex;gap:8px;align-items:center;margin-top:2px">
			<button type="button" class="btn btn-ghost btn-sm" onclick={() => previewFileInput.click()}>Wgraj obrazek</button>
			{#if previewImageUrl}
				<button type="button" class="btn btn-ghost btn-sm btn-icon-danger" onclick={() => { previewImageUrl = ''; markDirty(); }}>✕ Usuń</button>
			{/if}
		</div>
		{#if previewImageUrl}
			<div style="margin-top:8px;height:120px;border-radius:var(--radius-md);background-size:cover;background-position:center;background-image:url('{previewImageUrl}')"></div>
		{/if}
		<input type="file" accept="image/*" bind:this={previewFileInput} onchange={onPreviewImagePicked} style="display:none" />
	</div>
</div>

<div class="form-field">
	<span class="form-label">Treść artykułu</span>
	<Editor bind:this={editorRef} initialContent={article?.content ?? ''} {uploadImage} onChange={markDirty} onStatus={setStatus} />
</div>
