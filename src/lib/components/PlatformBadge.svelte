<script lang="ts">
	import { getContext } from 'svelte';
	import { findPlatform, hexToRgba, DEFAULT_PLATFORMS, type Platform } from '$lib/platforms';

	let { value }: { value: string } = $props();

	const getPlatforms = getContext<() => Platform[]>('platforms');
	const platform = $derived(findPlatform(value, getPlatforms?.() ?? DEFAULT_PLATFORMS));
</script>

{#if platform}
	<span class="domain-tag" style="background:{hexToRgba(platform.color, 0.12)};color:{platform.color}">
		{platform.label}
	</span>
{:else}
	<span class="domain-tag" style="background:var(--color-border);color:var(--color-text-muted)">{value}</span>
{/if}
