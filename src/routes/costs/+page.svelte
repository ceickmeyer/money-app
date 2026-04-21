<script lang="ts">
	import { appStore } from '$lib/stores/data.svelte'
	import { getMonthlyCostTotal } from '$lib/utils/calc'
	import type { CostItem } from '$lib/types'

	let currentMonth = $state(new Date().toISOString().slice(0, 7))

	function prevMonth() {
		const [y, m] = currentMonth.split('-').map(Number)
		currentMonth = new Date(y, m - 2, 1).toISOString().slice(0, 7)
	}

	function nextMonth() {
		const [y, m] = currentMonth.split('-').map(Number)
		currentMonth = new Date(y, m, 1).toISOString().slice(0, 7)
	}

	function formatMonth(month: string): string {
		const [y, m] = month.split('-').map(Number)
		return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
	}

	let costs = $derived(
		appStore.monthlyCosts[currentMonth] ?? { month: currentMonth, totalOverride: null, items: [] }
	)

	let total = $derived(getMonthlyCostTotal(costs))

	let newItemName = $state('')
	let newItemAmount = $state('')

	function addItem() {
		const name = newItemName.trim()
		const amount = parseFloat(newItemAmount)
		if (!name || isNaN(amount) || amount <= 0) return
		appStore.addCostItem(currentMonth, name, amount)
		newItemName = ''
		newItemAmount = ''
	}

	function updateItem(item: CostItem, field: 'name' | 'amount', value: string) {
		const updated = costs.items.map((i) => {
			if (i.id !== item.id) return i
			if (field === 'name') return { ...i, name: value }
			const amount = parseFloat(value)
			return { ...i, amount: isNaN(amount) ? i.amount : amount }
		})
		appStore.setCostItems(currentMonth, updated)
	}

	let overrideInput = $state('')

	$effect(() => {
		overrideInput =
			costs.totalOverride !== null && costs.totalOverride !== undefined
				? String(costs.totalOverride)
				: ''
	})

	function handleOverrideChange(value: string) {
		overrideInput = value
		const parsed = parseFloat(value)
		appStore.setCostOverride(currentMonth, value.trim() === '' ? null : isNaN(parsed) ? null : parsed)
	}
</script>

<main class="mx-auto max-w-lg px-4 pt-6">
	<!-- Month nav -->
	<div class="mb-5 flex items-center justify-between">
		<button
			onclick={prevMonth}
			aria-label="Previous month"
			class="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 active:bg-gray-200"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<polyline points="15 18 9 12 15 6" />
			</svg>
		</button>
		<h1 class="text-base font-semibold text-gray-800">{formatMonth(currentMonth)}</h1>
		<button
			onclick={nextMonth}
			aria-label="Next month"
			class="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 active:bg-gray-200"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-5 w-5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<polyline points="9 18 15 12 9 6" />
			</svg>
		</button>
	</div>

	<!-- Total display -->
	<div class="mb-4 rounded-xl bg-white p-4 shadow-sm">
		<p class="text-xs text-gray-500">Monthly Total</p>
		<p class="mt-0.5 text-3xl font-bold text-red-500">${total.toFixed(2)}</p>
		{#if costs.totalOverride !== null}
			<p class="mt-1 text-xs text-orange-500">Override active — line items ignored</p>
		{:else if costs.items.length > 0}
			<p class="mt-1 text-xs text-gray-400">Sum of {costs.items.length} item{costs.items.length !== 1 ? 's' : ''}</p>
		{/if}
	</div>

	<!-- Cost items -->
	<section class="mb-4 rounded-xl bg-white p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-gray-700">Cost Items</h2>

		{#if costs.items.length === 0}
			<p class="mb-3 text-xs text-gray-400">No items yet.</p>
		{:else}
			<div class="mb-3 space-y-2">
				{#each costs.items as item (item.id)}
					<div class="flex items-center gap-2">
						<input
							type="text"
							value={item.name}
							onblur={(e) => updateItem(item, 'name', (e.target as HTMLInputElement).value)}
							class="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
						/>
						<input
							type="number"
							inputmode="decimal"
							value={item.amount}
							onblur={(e) => updateItem(item, 'amount', (e.target as HTMLInputElement).value)}
							class="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
						/>
						<button
							onclick={() => appStore.deleteCostItem(currentMonth, item.id)}
							aria-label="Delete {item.name}"
							class="flex-shrink-0 text-gray-300 hover:text-red-400"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Add item row -->
		<div class="flex gap-2 border-t border-gray-100 pt-3">
			<input
				bind:value={newItemName}
				type="text"
				placeholder="Item name"
				class="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
			/>
			<input
				bind:value={newItemAmount}
				type="number"
				inputmode="decimal"
				placeholder="Amount"
				class="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
			/>
			<button
				onclick={addItem}
				disabled={!newItemName.trim() || !newItemAmount}
				class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40 active:bg-blue-700"
			>
				Add
			</button>
		</div>
	</section>

	<!-- Total override -->
	<section class="rounded-xl bg-white p-4 shadow-sm">
		<h2 class="mb-1 text-sm font-semibold text-gray-700">Total Override</h2>
		<p class="mb-3 text-xs text-gray-400">
			When set, this overrides the sum of line items above.
		</p>
		<input
			type="number"
			inputmode="decimal"
			value={overrideInput}
			oninput={(e) => handleOverrideChange((e.target as HTMLInputElement).value)}
			placeholder="e.g. 4500"
			class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none {costs.totalOverride !==
			null
				? 'border-orange-300 bg-orange-50'
				: ''}"
		/>
		{#if costs.totalOverride !== null}
			<button
				onclick={() => appStore.setCostOverride(currentMonth, null)}
				class="mt-2 text-xs text-orange-500 underline"
			>
				Clear override
			</button>
		{/if}
	</section>
</main>
