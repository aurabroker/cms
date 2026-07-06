<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Editor } from '@tiptap/core';

	let {
		initialContent = '',
		uploadImage,
		onChange,
		onStatus
	}: {
		initialContent?: string;
		uploadImage: (file: File) => Promise<string | null>;
		onChange?: () => void;
		onStatus?: (state: 'saving' | 'saved' | 'error', text: string) => void;
	} = $props();

	let editorEl: HTMLDivElement;
	let editor: Editor | null = null;
	let fileInput: HTMLInputElement;

	// Stan aktywnych formatowań (do podświetlania przycisków).
	let active = $state({
		blockType: 'p',
		bold: false,
		italic: false,
		underline: false,
		strike: false,
		bullet: false,
		ordered: false,
		quote: false,
		link: false,
		alignLeft: false,
		alignCenter: false,
		alignRight: false,
		inTable: false,
		image: false
	});
	let counts = $state({ chars: 0, words: 0 });

	// Modale
	let linkModal = $state({ open: false, url: '', newTab: true, nofollow: false });
	let ytModal = $state({ open: false, url: '', error: '' });
	let imgModal = $state({ open: false, alt: '' });

	// ── Publiczne API (dostępne przez bind:this) ──────────────────────────────
	export function getHTML(): string {
		return editor?.getHTML() ?? '';
	}
	export function isEmpty(): boolean {
		return editor?.isEmpty ?? true;
	}
	export function setContent(html: string) {
		editor?.commands.setContent(html || '');
	}
	export function focus() {
		editor?.commands.focus();
	}

	function refresh() {
		if (!editor) return;
		active = {
			blockType: editor.isActive('heading', { level: 2 })
				? 'h2'
				: editor.isActive('heading', { level: 3 })
					? 'h3'
					: 'p',
			bold: editor.isActive('bold'),
			italic: editor.isActive('italic'),
			underline: editor.isActive('underline'),
			strike: editor.isActive('strike'),
			bullet: editor.isActive('bulletList'),
			ordered: editor.isActive('orderedList'),
			quote: editor.isActive('blockquote'),
			link: editor.isActive('link'),
			alignLeft: editor.isActive({ textAlign: 'left' }),
			alignCenter: editor.isActive({ textAlign: 'center' }),
			alignRight: editor.isActive({ textAlign: 'right' }),
			inTable: editor.isActive('table'),
			image: editor.isActive('image')
		};
		const cc = editor.storage.characterCount;
		counts = { chars: cc?.characters() ?? 0, words: cc?.words() ?? 0 };
	}

	onMount(async () => {
		const [
			{ Editor: TEditor },
			{ default: StarterKit },
			{ default: Image },
			{ default: Link },
			{ default: Underline },
			{ default: Placeholder },
			{ default: Youtube },
			{ default: TextAlign },
			{ default: CharacterCount },
			{ default: Table },
			{ default: TableRow },
			{ default: TableHeader },
			{ default: TableCell }
		] = await Promise.all([
			import('@tiptap/core'),
			import('@tiptap/starter-kit'),
			import('@tiptap/extension-image'),
			import('@tiptap/extension-link'),
			import('@tiptap/extension-underline'),
			import('@tiptap/extension-placeholder'),
			import('@tiptap/extension-youtube'),
			import('@tiptap/extension-text-align'),
			import('@tiptap/extension-character-count'),
			import('@tiptap/extension-table'),
			import('@tiptap/extension-table-row'),
			import('@tiptap/extension-table-header'),
			import('@tiptap/extension-table-cell')
		]);

		// Obraz z dodatkowym atrybutem wyrównania (data-align).
		const AlignImage = Image.extend({
			addAttributes() {
				return {
					...this.parent?.(),
					'data-align': {
						default: null,
						parseHTML: (el: HTMLElement) => el.getAttribute('data-align'),
						renderHTML: (attrs: Record<string, unknown>) =>
							attrs['data-align'] ? { 'data-align': attrs['data-align'] } : {}
					}
				};
			}
		});

		editor = new TEditor({
			element: editorEl,
			extensions: [
				StarterKit.configure({ heading: { levels: [2, 3] } }),
				Underline,
				Link.configure({ openOnClick: false, autolink: true }),
				Placeholder.configure({ placeholder: 'Zacznij pisać swój artykuł tutaj...' }),
				Youtube.configure({ nocookie: true, width: 640, height: 360 }),
				TextAlign.configure({ types: ['heading', 'paragraph'] }),
				CharacterCount,
				AlignImage.configure({ inline: false }),
				Table.configure({ resizable: true }),
				TableRow,
				TableHeader,
				TableCell
			],
			content: initialContent,
			editorProps: {
				// Czyszczenie wklejanego HTML (Word / Google Docs): usuń style i klasy.
				transformPastedHTML: (html: string) =>
					html.replace(/ style="[^"]*"/gi, '').replace(/ class="[^"]*"/gi, '')
			},
			onUpdate: () => {
				onChange?.();
				refresh();
			},
			onSelectionUpdate: refresh,
			onTransaction: refresh
		});

		// Wklejanie zdjęć ze schowka → upload do Storage.
		editor.view.dom.addEventListener('paste', async (e: ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (!items) return;
			for (const item of Array.from(items)) {
				if (item.type.startsWith('image/')) {
					e.preventDefault();
					const file = item.getAsFile();
					if (!file) return;
					const url = await uploadImage(file);
					if (url) editor?.chain().focus().setImage({ src: url }).run();
					return;
				}
			}
		});

		refresh();
	});

	onDestroy(() => editor?.destroy());

	// ── Akcje toolbara ────────────────────────────────────────────────────────
	const chain = () => editor!.chain().focus();

	function setBlockType(value: string) {
		if (value === 'h2') chain().toggleHeading({ level: 2 }).run();
		else if (value === 'h3') chain().toggleHeading({ level: 3 }).run();
		else chain().setParagraph().run();
	}

	function openLinkModal() {
		linkModal = {
			open: true,
			url: editor?.getAttributes('link').href ?? '',
			newTab: editor?.getAttributes('link').target === '_blank',
			nofollow: (editor?.getAttributes('link').rel ?? '').includes('nofollow')
		};
	}
	function applyLink() {
		const url = linkModal.url.trim();
		if (!url) {
			chain().unsetLink().run();
		} else {
			const rel = ['noopener', 'noreferrer', linkModal.nofollow ? 'nofollow' : '']
				.filter(Boolean)
				.join(' ');
			chain()
				.extendMarkRange('link')
				.setLink({ href: url, target: linkModal.newTab ? '_blank' : null, rel })
				.run();
		}
		linkModal.open = false;
	}

	function openYoutube() {
		ytModal = { open: true, url: '', error: '' };
	}
	function applyYoutube() {
		const url = ytModal.url.trim();
		if (!/youtu\.?be/.test(url)) {
			ytModal.error = 'Podaj poprawny link YouTube.';
			return;
		}
		editor?.commands.setYoutubeVideo({ src: url });
		ytModal.open = false;
	}

	function pickImage() {
		fileInput.value = '';
		fileInput.click();
	}
	async function onImagePicked() {
		const file = fileInput.files?.[0];
		if (!file) return;
		const url = await uploadImage(file);
		if (url) chain().setImage({ src: url }).run();
	}
	function setImageAlign(value: string | null) {
		editor?.chain().focus().updateAttributes('image', { 'data-align': value }).run();
	}
	function openImageAlt() {
		imgModal = { open: true, alt: editor?.getAttributes('image').alt ?? '' };
	}
	function applyImageAlt() {
		editor?.chain().focus().updateAttributes('image', { alt: imgModal.alt }).run();
		imgModal.open = false;
	}
</script>

<div class="tiptap-wrap">
	<div class="tiptap-toolbar">
		<select
			class="tb-select"
			value={active.blockType}
			onchange={(e) => setBlockType(e.currentTarget.value)}
			title="Typ bloku"
		>
			<option value="p">Tekst</option>
			<option value="h2">Nagłówek H2</option>
			<option value="h3">Nagłówek H3</option>
		</select>
		<span class="tb-sep"></span>

		<button type="button" class="tb-btn" class:is-active={active.bold} onclick={() => chain().toggleBold().run()} title="Pogrubienie"><strong>B</strong></button>
		<button type="button" class="tb-btn" class:is-active={active.italic} onclick={() => chain().toggleItalic().run()} title="Kursywa"><em>I</em></button>
		<button type="button" class="tb-btn" class:is-active={active.underline} onclick={() => chain().toggleUnderline().run()} title="Podkreślenie"><u>U</u></button>
		<button type="button" class="tb-btn" class:is-active={active.strike} onclick={() => chain().toggleStrike().run()} title="Przekreślenie"><s>S</s></button>
		<span class="tb-sep"></span>

		<button type="button" class="tb-btn" class:is-active={active.alignLeft} onclick={() => chain().setTextAlign('left').run()} title="Do lewej">⇤</button>
		<button type="button" class="tb-btn" class:is-active={active.alignCenter} onclick={() => chain().setTextAlign('center').run()} title="Wyśrodkuj">↔</button>
		<button type="button" class="tb-btn" class:is-active={active.alignRight} onclick={() => chain().setTextAlign('right').run()} title="Do prawej">⇥</button>
		<span class="tb-sep"></span>

		<button type="button" class="tb-btn" class:is-active={active.bullet} onclick={() => chain().toggleBulletList().run()} title="Lista punktowana">• —</button>
		<button type="button" class="tb-btn" class:is-active={active.ordered} onclick={() => chain().toggleOrderedList().run()} title="Lista numerowana">1.</button>
		<button type="button" class="tb-btn" class:is-active={active.quote} onclick={() => chain().toggleBlockquote().run()} title="Cytat">❝</button>
		<span class="tb-sep"></span>

		<button type="button" class="tb-btn" class:is-active={active.link} onclick={openLinkModal} title="Link">🔗</button>
		<button type="button" class="tb-btn" onclick={pickImage} title="Wstaw zdjęcie">🖼</button>
		<button type="button" class="tb-btn" onclick={openYoutube} title="Wstaw YouTube">▶</button>
		<button type="button" class="tb-btn" onclick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Wstaw tabelę">▦</button>
		<span class="tb-sep"></span>

		{#if active.image}
			<span class="tb-badge">Obraz:</span>
			<button type="button" class="tb-btn" onclick={() => setImageAlign('left')} title="Obraz do lewej">⇤</button>
			<button type="button" class="tb-btn" onclick={() => setImageAlign('center')} title="Obraz na środku">↔</button>
			<button type="button" class="tb-btn" onclick={() => setImageAlign('right')} title="Obraz do prawej">⇥</button>
			<button type="button" class="tb-btn" onclick={() => setImageAlign(null)} title="Bez wyrównania">✕</button>
			<button type="button" class="tb-btn" onclick={openImageAlt} title="Tekst alternatywny (alt)">ALT</button>
			<span class="tb-sep"></span>
		{/if}

		{#if active.inTable}
			<span class="tb-badge">Tabela:</span>
			<button type="button" class="tb-btn" onclick={() => editor?.chain().focus().addColumnAfter().run()} title="Dodaj kolumnę">+Kol</button>
			<button type="button" class="tb-btn" onclick={() => editor?.chain().focus().addRowAfter().run()} title="Dodaj wiersz">+Wrsz</button>
			<button type="button" class="tb-btn" onclick={() => editor?.chain().focus().deleteColumn().run()} title="Usuń kolumnę">−Kol</button>
			<button type="button" class="tb-btn" onclick={() => editor?.chain().focus().deleteRow().run()} title="Usuń wiersz">−Wrsz</button>
			<button type="button" class="tb-btn btn-icon-danger" onclick={() => editor?.chain().focus().deleteTable().run()} title="Usuń tabelę">⌫</button>
			<span class="tb-sep"></span>
		{/if}

		<button type="button" class="tb-btn" onclick={() => chain().unsetAllMarks().clearNodes().run()} title="Usuń formatowanie">✕</button>
		<button type="button" class="tb-btn" onclick={() => chain().undo().run()} title="Cofnij">↶</button>
		<button type="button" class="tb-btn" onclick={() => chain().redo().run()} title="Ponów">↷</button>
	</div>

	<div class="tiptap-editor" bind:this={editorEl}></div>

	<div class="editor-charcount">
		<span>{counts.words} słów</span>
		<span>{counts.chars} znaków</span>
	</div>
</div>

<input type="file" accept="image/*" bind:this={fileInput} onchange={onImagePicked} style="display:none" />

<!-- Modal: Link -->
<div class="modal-overlay" class:open={linkModal.open} onclick={(e) => { if (e.target === e.currentTarget) linkModal.open = false; }} role="presentation">
	<div class="modal">
		<div class="modal-header"><h3>Wstaw / edytuj link</h3></div>
		<div class="modal-body">
			<div class="form-field">
				<label class="form-label" for="lm-url">Adres URL</label>
				<input id="lm-url" class="form-input" bind:value={linkModal.url} placeholder="https://…" />
			</div>
			<label style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
				<input type="checkbox" bind:checked={linkModal.newTab} /> Otwórz w nowej karcie
			</label>
			<label style="display:flex;align-items:center;gap:8px">
				<input type="checkbox" bind:checked={linkModal.nofollow} /> rel="nofollow" (link sponsorowany/zewnętrzny)
			</label>
		</div>
		<div class="modal-footer">
			<button class="btn btn-ghost" onclick={() => (linkModal.open = false)}>Anuluj</button>
			<button class="btn btn-primary" onclick={applyLink}>Zapisz link</button>
		</div>
	</div>
</div>

<!-- Modal: YouTube -->
<div class="modal-overlay" class:open={ytModal.open} onclick={(e) => { if (e.target === e.currentTarget) ytModal.open = false; }} role="presentation">
	<div class="modal">
		<div class="modal-header"><h3>Wstaw film YouTube</h3></div>
		<div class="modal-body">
			<div class="form-field">
				<label class="form-label" for="yt-url">Link do filmu</label>
				<input id="yt-url" class="form-input" bind:value={ytModal.url} placeholder="https://youtu.be/…" />
			</div>
			{#if ytModal.error}<p class="login-error">{ytModal.error}</p>{/if}
		</div>
		<div class="modal-footer">
			<button class="btn btn-ghost" onclick={() => (ytModal.open = false)}>Anuluj</button>
			<button class="btn btn-primary" onclick={applyYoutube}>Wstaw</button>
		</div>
	</div>
</div>

<!-- Modal: Alt zdjęcia -->
<div class="modal-overlay" class:open={imgModal.open} onclick={(e) => { if (e.target === e.currentTarget) imgModal.open = false; }} role="presentation">
	<div class="modal">
		<div class="modal-header"><h3>Tekst alternatywny (alt)</h3></div>
		<div class="modal-body">
			<div class="form-field">
				<label class="form-label" for="img-alt">Opis obrazu — ważny dla SEO i dostępności</label>
				<input id="img-alt" class="form-input" bind:value={imgModal.alt} placeholder="np. Wykres wzrostu benefitów 2026" />
			</div>
		</div>
		<div class="modal-footer">
			<button class="btn btn-ghost" onclick={() => (imgModal.open = false)}>Anuluj</button>
			<button class="btn btn-primary" onclick={applyImageAlt}>Zapisz</button>
		</div>
	</div>
</div>

<style>
	.tb-badge {
		font-size: 11px;
		color: var(--color-text-faint);
		font-weight: 700;
		text-transform: uppercase;
		padding: 0 4px;
	}
</style>
