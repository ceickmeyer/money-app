<script lang="ts">
	import { appStore } from '$lib/stores/data.svelte'
	import { buildChartData, getSummaryStats, getSummaryAsOfDay } from '$lib/utils/calc'
	import EarningsChart from '$lib/components/EarningsChart.svelte'

	const today = new Date()
	const todayMonth = today.toISOString().slice(0, 7)
	const todayDate = today.getDate()

	function formatDay(month: string): string {
		const [y, m] = month.split('-').map(Number)
		return new Date(y, m - 1, todayDate).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		})
	}

	let currentMonth = $state(todayMonth)

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

	let todayDay = $derived(currentMonth === todayMonth ? todayDate : null)

	let chartData = $derived(
		buildChartData(
			appStore.sessions,
			appStore.oneOffEntries,
			appStore.recurring,
			appStore.monthlyCosts[currentMonth],
			currentMonth
		)
	)

	let stats = $derived(
		getSummaryStats(
			appStore.sessions,
			appStore.oneOffEntries,
			appStore.recurring,
			appStore.monthlyCosts[currentMonth],
			currentMonth
		)
	)

	let todayStats = $derived(
		todayDay != null
			? getSummaryAsOfDay(
					appStore.sessions,
					appStore.oneOffEntries,
					appStore.recurring,
					appStore.monthlyCosts[currentMonth],
					currentMonth,
					todayDay
				)
			: null
	)
</script>

<main class="mx-auto max-w-lg px-4 pt-6">
	<div class="mb-4 flex items-center justify-between">
		<button
			onclick={prevMonth}
			aria-label="Previous month"
			class="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 active:bg-gray-200"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="15 18 9 12 15 6" />
			</svg>
		</button>
		<h1 class="text-base font-semibold text-gray-800">{formatMonth(currentMonth)}</h1>
		<button
			onclick={nextMonth}
			aria-label="Next month"
			class="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 active:bg-gray-200"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="9 18 15 12 9 6" />
			</svg>
		</button>
	</div>

	<div class="rounded-xl bg-white p-4 shadow-sm">
		<EarningsChart
			labels={chartData.labels}
			earnings={chartData.earnings}
			burndown={chartData.burndown}
			breakdown={chartData.breakdown}
			{todayDay}
		/>
	</div>

	<!-- As-of-today box (current month only) -->
	{#if todayStats}
		<div class="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
			<p class="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">As of {formatDay(currentMonth)}</p>
			<div class="grid grid-cols-3 gap-3">
				<div>
					<p class="text-xs text-gray-500">Earned</p>
					<p class="text-base font-bold text-green-600">${todayStats.earned.toFixed(2)}</p>
				</div>
				<div>
					<p class="text-xs text-gray-500">Costs</p>
					<p class="text-base font-bold text-red-500">${todayStats.costs.toFixed(2)}</p>
				</div>
				<div>
					<p class="text-xs text-gray-500">Net</p>
					<p class="text-base font-bold {todayStats.net >= 0 ? 'text-blue-600' : 'text-red-600'}">${todayStats.net.toFixed(2)}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Full-month projections -->
	<div class="mt-3 grid grid-cols-3 gap-3">
		<div class="rounded-xl bg-white p-3 shadow-sm">
			<p class="text-xs text-gray-500">Full Month</p>
			<p class="mt-0.5 text-lg font-bold text-green-600">${stats.totalEarned.toFixed(2)}</p>
		</div>
		<div class="rounded-xl bg-white p-3 shadow-sm">
			<p class="text-xs text-gray-500">Costs</p>
			<p class="mt-0.5 text-lg font-bold text-red-500">${stats.monthlyCosts.toFixed(2)}</p>
		</div>
		<div class="rounded-xl bg-white p-3 shadow-sm">
			<p class="text-xs text-gray-500">Net</p>
			<p class="mt-0.5 text-lg font-bold {stats.net >= 0 ? 'text-blue-600' : 'text-red-600'}">${stats.net.toFixed(2)}</p>
		</div>
	</div>
</main>
