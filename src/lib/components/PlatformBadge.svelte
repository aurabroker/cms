<script lang="ts">
	import { platformByValue } from '$lib/platforms';

	let { value }: { value: string } = $props();

	const platform = $derived(platformByValue(value));
</script>

<span class="domain-tag {platform?.cssClass ?? 'd-aura'}">{platform?.label ?? value}</span>
