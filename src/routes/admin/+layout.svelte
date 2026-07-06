<script lang="ts">
	import { page } from '$app/state';
	import {
		BookOpen,
		LayoutDashboard,
		FileText,
		Share2,
		BarChart2,
		Users,
		Scale,
		Briefcase,
		Users2,
		LogOut,
		Menu
	} from '@lucide/svelte';
	import ThemeToggle from '$components/ThemeToggle.svelte';
	import { REVIEW_TABLES } from '$lib/types';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	let sidebarOpen = $state(false);

	const reviewIcons = { div_review: Scale, ud_review: Briefcase, aura_reviews: Users2 };

	const nav = [
		{ href: '/admin', label: 'Pulpit', icon: LayoutDashboard },
		{ href: '/admin/artykuly', label: 'Artykuły', icon: FileText },
		{ href: '/admin/analityka', label: 'Analityka', icon: BarChart2 }
	];

	function isActive(href: string): boolean {
		if (href === '/admin') return page.url.pathname === '/admin';
		return page.url.pathname.startsWith(href);
	}

	const currentTitle = $derived.by(() => {
		const p = page.url.pathname;
		if (p.startsWith('/admin/artykuly/edytor')) return 'Edytor artykułu';
		if (p.startsWith('/admin/artykuly')) return 'Artykuły';
		if (p.startsWith('/admin/opinie')) return 'Opinie klientów';
		if (p.startsWith('/admin/analityka')) return 'Analityka';
		return 'Pulpit';
	});
</script>

<div class="app-container">
	<aside class="sidebar" class:mobile-open={sidebarOpen}>
		<a href="/" class="brand" style="cursor:pointer;text-decoration:none">
			<div class="brand-logo">A</div>
			<span>Aura<span class="brand-sub">HUB</span></span>
		</a>

		<div class="nav-section">
			<div class="nav-label">Publiczne</div>
			<a class="nav-item" href="/">
				<BookOpen size={17} /> Baza Wiedzy
			</a>
		</div>

		<div class="nav-section">
			<div class="nav-label">Panel Redaktora</div>
			{#each nav as item}
				{@const Icon = item.icon}
				<a class="nav-item" class:active={isActive(item.href)} href={item.href}>
					<Icon size={17} />
					{item.label}
				</a>
			{/each}
		</div>

		<div class="nav-section nav-section-reviews">
			<div class="nav-label">Opinie klientów</div>
			{#each Object.values(REVIEW_TABLES) as meta}
				{@const Icon = reviewIcons[meta.key]}
				<a
					class="nav-item"
					class:active={page.url.pathname === `/admin/opinie/${meta.key}`}
					href={`/admin/opinie/${meta.key}`}
				>
					<Icon size={17} />
					{meta.label}
					<span class="nav-item-count">{data.reviewCounts[meta.key]}</span>
				</a>
			{/each}
		</div>

		<div class="sidebar-footer">
			<form method="POST" action="/logout">
				<button type="submit" class="nav-item nav-item-danger" style="width:100%">
					<LogOut size={17} /> Wyloguj
				</button>
			</form>
		</div>
	</aside>

	<div class="main-content">
		<header class="topbar">
			<div style="display:flex;align-items:center;gap:10px">
				<button
					class="btn-icon"
					onclick={() => (sidebarOpen = !sidebarOpen)}
					title="Menu"
					aria-label="Menu"
				>
					<Menu size={20} />
				</button>
				<span class="topbar-title">{currentTitle}</span>
			</div>
			<div style="display:flex;align-items:center;gap:8px">
				{#if data.userEmail}
					<span class="topbar-user">{data.userEmail}</span>
				{/if}
				<ThemeToggle />
			</div>
		</header>

		<main class="content-area">
			{@render children()}
		</main>
	</div>
</div>
