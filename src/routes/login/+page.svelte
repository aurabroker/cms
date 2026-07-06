<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
</script>

<svelte:head>
	<title>Logowanie — AuraHUB CMS</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="login-screen">
	<div class="login-box">
		<div class="login-brand">
			<div class="login-logo">A</div>
			<div>
				<div class="login-title">AuraHUB <span class="login-cms-label">CMS</span></div>
			</div>
		</div>
		<p class="login-hint">Zaloguj się, aby uzyskać dostęp do panelu redaktora.</p>

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
		>
			<input type="hidden" name="returnTo" value={data.returnTo} />
			<div class="form-field">
				<label class="form-label" for="email">E-mail</label>
				<input
					id="email"
					type="email"
					name="email"
					autocomplete="email"
					class="form-input"
					placeholder="admin@auraconsulting.pl"
					value={form?.email ?? ''}
					required
				/>
			</div>
			<div class="form-field">
				<label class="form-label" for="password">Hasło</label>
				<input
					id="password"
					type="password"
					name="password"
					autocomplete="current-password"
					class="form-input"
					placeholder="••••••••"
					required
				/>
			</div>

			{#if form?.error}
				<p class="login-error">{form.error}</p>
			{/if}

			<button type="submit" class="btn btn-primary" style="width:100%;margin-top:16px" disabled={loading}>
				{loading ? 'Logowanie...' : 'Zaloguj się'}
			</button>
		</form>
	</div>
</div>
