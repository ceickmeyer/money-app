<script lang="ts">
	import { appStore } from '$lib/stores/data.svelte'
	import { parseTutoringSessions } from '$lib/utils/parse'

	// ── Tutoring paste ──────────────────────────────────────────────────────────
	let pasteText = $state('')
	let parseResult = $state<{ added: number; skipped: number } | null>(null)

	function handleParse() {
		const parsed = parseTutoringSessions(pasteText)
		const existing = new Set(
			appStore.sessions.map((s) => `${s.date}|${s.studentName}|${s.startTime}`)
		)
		const newSessions = parsed.filter(
			(s) => !existing.has(`${s.date}|${s.studentName}|${s.startTime}`)
		)
		appStore.addSessions(newSessions)
		parseResult = { added: newSessions.length, skipped: parsed.length - newSessions.length }
		pasteText = ''
	}

	// Sessions grouped by date for display
	let sessionsByDate = $derived(() => {
		const sorted = [...appStore.sessions].sort((a, b) => {
			const dateCmp = a.date.localeCompare(b.date)
			return dateCmp !== 0 ? dateCmp : a.startTime.localeCompare(b.startTime)
		})
		const groups: { date: string; sessions: typeof sorted }[] = []
		for (const s of sorted) {
			const last = groups[groups.length - 1]
			if (last?.date === s.date) last.sessions.push(s)
			else groups.push({ date: s.date, sessions: [s] })
		}
		return groups
	})

	const statusColors: Record<string, string> = {
		Attended: 'bg-green-100 text-green-700',
		Missed: 'bg-red-100 text-red-600',
		Scheduled: 'bg-blue-100 text-blue-600'
	}

	// ── Monthly recurring income ────────────────────────────────────────────────
	let newRecurringName = $state('')
	let newRecurringRate = $state('')
	let newRecurringTimes = $state('')

	function addRecurring() {
		const name = newRecurringName.trim()
		const rate = parseFloat(newRecurringRate)
		const times = parseInt(newRecurringTimes)
		if (!name || isNaN(rate) || rate <= 0 || isNaN(times) || times <= 0) return
		appStore.addRecurring(name, rate, times)
		newRecurringName = ''
		newRecurringRate = ''
		newRecurringTimes = ''
	}

	// ── One-off income ──────────────────────────────────────────────────────────
	let newOneOffDate = $state(new Date().toISOString().slice(0, 10))
	let newOneOffDesc = $state('')
	let newOneOffAmount = $state('')

	function addOneOff() {
		const desc = newOneOffDesc.trim()
		const amount = parseFloat(newOneOffAmount)
		if (!newOneOffDate || !desc || isNaN(amount) || amount <= 0) return
		appStore.addOneOff(newOneOffDate, desc, amount)
		newOneOffDesc = ''
		newOneOffAmount = ''
	}

	let sortedOneOff = $derived(
		[...appStore.oneOffEntries].sort((a, b) => b.date.localeCompare(a.date))
	)
</script>

<main class="mx-auto max-w-lg px-4 pt-6 pb-4">
	<h1 class="mb-5 text-lg font-bold text-gray-800">Income</h1>

	<!-- ── Tutoring Paste ──────────────────────────────────────────────────── -->
	<section class="mb-5 rounded-xl bg-white p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-gray-700">Paste Tutoring Schedule</h2>
		<textarea
			bind:value={pasteText}
			rows={6}
			placeholder="Paste your tutoring schedule here..."
			class="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-relaxed text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
		></textarea>
		<button
			onclick={handleParse}
			disabled={!pasteText.trim()}
			class="mt-3 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white disabled:opacity-40 active:bg-blue-700"
		>
			Parse & Add Sessions
		</button>
		{#if parseResult}
			<p class="mt-2 text-center text-xs text-gray-500">
				<span class="font-medium text-green-600">+{parseResult.added} added</span>
				{#if parseResult.skipped > 0}
					· {parseResult.skipped} duplicate{parseResult.skipped > 1 ? 's' : ''} skipped
				{/if}
			</p>
		{/if}
	</section>

	<!-- ── Parsed Sessions ────────────────────────────────────────────────── -->
	{#if appStore.sessions.length > 0}
		<section class="mb-5 rounded-xl bg-white shadow-sm">
			<div class="flex items-center justify-between px-4 pt-4 pb-2">
				<h2 class="text-sm font-semibold text-gray-700">Parsed Sessions</h2>
				<span class="text-xs text-gray-400">{appStore.sessions.length} sessions</span>
			</div>
			<div class="divide-y divide-gray-50">
				{#each sessionsByDate() as group (group.date)}
					<div>
						<p class="bg-gray-50 px-4 py-1.5 text-xs font-medium text-gray-500">{group.date}</p>
						{#each group.sessions as s (s.id)}
							<div class="flex items-center gap-2 px-4 py-2">
								<div class="min-w-0 flex-1">
									<span class="block truncate text-sm text-gray-800">{s.studentName}</span>
									<span class="text-xs text-gray-400">{s.startTime} – {s.endTime}</span>
								</div>
								<span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {statusColors[s.status] ?? 'bg-gray-100 text-gray-500'}">
									{s.status}
								</span>
								<input
									type="number"
									inputmode="decimal"
									value={s.amount}
									onblur={(e) => {
										const v = parseFloat((e.target as HTMLInputElement).value)
										if (!isNaN(v) && v >= 0) appStore.updateSessionAmount(s.id, v)
									}}
									class="w-16 rounded border border-gray-200 px-2 py-1 text-right text-sm focus:border-blue-400 focus:outline-none"
								/>
								<button
									onclick={() => appStore.deleteSession(s.id)}
									aria-label="Remove session"
									class="shrink-0 text-gray-300 hover:text-red-400"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
									</svg>
								</button>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- ── Monthly Recurring Income ───────────────────────────────────────── -->
	<section class="mb-5 rounded-xl bg-white p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-gray-700">Monthly Recurring</h2>

		{#if appStore.recurring.length > 0}
			<div class="mb-4 space-y-2">
				{#each appStore.recurring as r (r.id)}
					<div class="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5">
						<div class="min-w-0 flex-1">
							<span class="block text-sm font-medium text-gray-800">{r.name}</span>
							<span class="text-xs text-gray-500">
								${r.rate} × {r.timesPerMonth}/mo = <span class="font-medium text-green-600">${(r.rate * r.timesPerMonth).toFixed(2)}</span>
							</span>
						</div>
						<button
							onclick={() => appStore.deleteRecurring(r.id)}
							aria-label="Delete {r.name}"
							class="shrink-0 text-gray-300 hover:text-red-400"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<div class="flex gap-2 border-t border-gray-100 pt-3">
			<input
				bind:value={newRecurringName}
				type="text"
				placeholder="Name"
				class="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
			/>
			<div class="relative w-20">
				<span class="absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-gray-400">$</span>
				<input
					bind:value={newRecurringRate}
					type="number"
					inputmode="decimal"
					placeholder="Rate"
					class="w-full rounded-lg border border-gray-200 py-2 pr-2 pl-6 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
				/>
			</div>
			<div class="relative w-16">
				<span class="absolute top-1/2 left-2 -translate-y-1/2 text-xs text-gray-400">×</span>
				<input
					bind:value={newRecurringTimes}
					type="number"
					inputmode="numeric"
					placeholder="×"
					class="w-full rounded-lg border border-gray-200 py-2 pr-2 pl-5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
				/>
			</div>
			<button
				onclick={addRecurring}
				disabled={!newRecurringName.trim() || !newRecurringRate || !newRecurringTimes}
				class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40 active:bg-blue-700"
			>
				Add
			</button>
		</div>
	</section>

	<!-- ── One-Off Income ─────────────────────────────────────────────────── -->
	<section class="mb-5 rounded-xl bg-white p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-gray-700">One-Off</h2>

		{#if sortedOneOff.length > 0}
			<div class="mb-4 space-y-2">
				{#each sortedOneOff as e (e.id)}
					<div class="flex items-center gap-2">
						<div class="min-w-0 flex-1">
							<span class="block text-sm text-gray-800">{e.description}</span>
							<span class="text-xs text-gray-400">{e.date}</span>
						</div>
						<span class="shrink-0 text-sm font-medium text-green-600">${e.amount.toFixed(2)}</span>
						<button
							onclick={() => appStore.deleteOneOff(e.id)}
							aria-label="Delete entry"
							class="shrink-0 text-gray-300 hover:text-red-400"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<div class="flex gap-2 border-t border-gray-100 pt-3">
			<input
				bind:value={newOneOffDate}
				type="date"
				class="w-36 shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
			/>
			<input
				bind:value={newOneOffDesc}
				type="text"
				placeholder="Description"
				class="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
			/>
			<div class="relative w-20">
				<span class="absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-gray-400">$</span>
				<input
					bind:value={newOneOffAmount}
					type="number"
					inputmode="decimal"
					placeholder="Amt"
					class="w-full rounded-lg border border-gray-200 py-2 pr-2 pl-6 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
				/>
			</div>
			<button
				onclick={addOneOff}
				disabled={!newOneOffDate || !newOneOffDesc.trim() || !newOneOffAmount}
				class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40 active:bg-blue-700"
			>
				Add
			</button>
		</div>
	</section>
</main>
