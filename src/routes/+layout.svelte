<script lang="ts">
	import '../app.css';
	import { onMount, setContext } from 'svelte';
	import { theme } from '$lib/theme.svelte';
	import { DEFAULT_PLATFORMS } from '$lib/platforms';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	// Lista platform dostępna dla wszystkich komponentów (np. PlatformBadge).
	setContext('platforms', () => data?.platforms ?? DEFAULT_PLATFORMS);

	onMount(() => theme.init());
</script>

{@render children()}
