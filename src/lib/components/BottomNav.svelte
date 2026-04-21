<script lang="ts">
	import { page } from '$app/stores'

	const tabs = [
		{ href: '/', label: 'Dashboard', exact: true },
		{ href: '/income', label: 'Income', exact: false },
		{ href: '/costs', label: 'Costs', exact: false }
	]

	function isActive(href: string, exact: boolean): boolean {
		const path = $page.url.pathname
		return exact ? path === href : path.startsWith(href)
	}
</script>

<nav
	class="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t border-gray-200 bg-white"
	style="padding-bottom: env(safe-area-inset-bottom)"
>
	{#each tabs as tab}
		{@const active = isActive(tab.href, tab.exact)}
		<a
			href={tab.href}
			class="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors {active
				? 'text-blue-600'
				: 'text-gray-500 hover:text-gray-700'}"
		>
			{#if tab.href === '/'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
				</svg>
			{:else if tab.href === '/income'}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<line x1="12" y1="1" x2="12" y2="23" />
					<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
				</svg>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<line x1="8" y1="6" x2="21" y2="6" />
					<line x1="8" y1="12" x2="21" y2="12" />
					<line x1="8" y1="18" x2="21" y2="18" />
					<line x1="3" y1="6" x2="3.01" y2="6" />
					<line x1="3" y1="12" x2="3.01" y2="12" />
					<line x1="3" y1="18" x2="3.01" y2="18" />
				</svg>
			{/if}
			{tab.label}
		</a>
	{/each}
</nav>
