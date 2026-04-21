import { browser } from '$app/environment'
import type { TutoringSession, RecurringIncome, OneOffEntry, CostItem, MonthlyCosts } from '$lib/types'

function load<T>(key: string, fallback: T): T {
	if (!browser) return fallback
	try {
		const raw = localStorage.getItem(key)
		return raw ? (JSON.parse(raw) as T) : fallback
	} catch {
		return fallback
	}
}

function createAppStore() {
	let sessions = $state<TutoringSession[]>([])
	let recurring = $state<RecurringIncome[]>([])
	let oneOffEntries = $state<OneOffEntry[]>([])
	let monthlyCosts = $state<Record<string, MonthlyCosts>>({})

	$effect.root(() => {
		sessions = load('money-app:sessions', [])
		recurring = load('money-app:recurring', [])
		oneOffEntries = load('money-app:oneoff', [])
		monthlyCosts = load('money-app:monthly-costs', {})

		$effect(() => {
			if (browser) localStorage.setItem('money-app:sessions', JSON.stringify(sessions))
		})
		$effect(() => {
			if (browser) localStorage.setItem('money-app:recurring', JSON.stringify(recurring))
		})
		$effect(() => {
			if (browser) localStorage.setItem('money-app:oneoff', JSON.stringify(oneOffEntries))
		})
		$effect(() => {
			if (browser) localStorage.setItem('money-app:monthly-costs', JSON.stringify(monthlyCosts))
		})
	})

	function ensureMonth(month: string): MonthlyCosts {
		if (!monthlyCosts[month]) {
			monthlyCosts = { ...monthlyCosts, [month]: { month, totalOverride: null, items: [] } }
		}
		return monthlyCosts[month]
	}

	return {
		get sessions() {
			return sessions
		},
		get recurring() {
			return recurring
		},
		get oneOffEntries() {
			return oneOffEntries
		},
		get monthlyCosts() {
			return monthlyCosts
		},

		// Sessions
		addSessions(newSessions: TutoringSession[]) {
			sessions = [...sessions, ...newSessions]
		},
		deleteSession(id: string) {
			sessions = sessions.filter((s) => s.id !== id)
		},
		updateSessionAmount(id: string, amount: number) {
			sessions = sessions.map((s) => (s.id === id ? { ...s, amount } : s))
		},

		// Recurring income
		addRecurring(name: string, rate: number, timesPerMonth: number): RecurringIncome {
			const r: RecurringIncome = { id: crypto.randomUUID(), name, rate, timesPerMonth }
			recurring = [...recurring, r]
			return r
		},
		deleteRecurring(id: string) {
			recurring = recurring.filter((r) => r.id !== id)
		},

		// One-off entries
		addOneOff(date: string, description: string, amount: number): OneOffEntry {
			const e: OneOffEntry = { id: crypto.randomUUID(), date, description, amount }
			oneOffEntries = [...oneOffEntries, e]
			return e
		},
		deleteOneOff(id: string) {
			oneOffEntries = oneOffEntries.filter((e) => e.id !== id)
		},

		// Costs
		addCostItem(month: string, name: string, amount: number) {
			const current = ensureMonth(month)
			const item: CostItem = { id: crypto.randomUUID(), name, amount }
			monthlyCosts = {
				...monthlyCosts,
				[month]: { ...current, items: [...current.items, item] }
			}
		},
		deleteCostItem(month: string, itemId: string) {
			const current = ensureMonth(month)
			monthlyCosts = {
				...monthlyCosts,
				[month]: { ...current, items: current.items.filter((i) => i.id !== itemId) }
			}
		},
		setCostItems(month: string, items: CostItem[]) {
			const current = ensureMonth(month)
			monthlyCosts = { ...monthlyCosts, [month]: { ...current, items } }
		},
		setCostOverride(month: string, override: number | null) {
			const current = ensureMonth(month)
			monthlyCosts = { ...monthlyCosts, [month]: { ...current, totalOverride: override } }
		}
	}
}

export const appStore = createAppStore()
