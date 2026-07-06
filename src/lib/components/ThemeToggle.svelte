<script lang="ts">
	import { Moon, Sun } from '@lucide/svelte';
	import { theme } from '$lib/theme.svelte';
</script>

<button class="btn-icon" onclick={() => theme.toggle()} title="Zmień motyw" aria-label="Zmień motyw">
	{#if theme.dark}
		<Sun size={18} />
	{:else}
		<Moon size={18} />
	{/if}
</button>
