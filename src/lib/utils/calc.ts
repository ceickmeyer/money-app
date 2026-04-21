import type { TutoringSession, OneOffEntry, RecurringIncome, MonthlyCosts, DayBreakdown } from '$lib/types'

export function getDaysInMonth(month: string): number {
	const [year, mon] = month.split('-').map(Number)
	return new Date(year, mon, 0).getDate()
}

export function getMonthlyCostTotal(costs: MonthlyCosts | undefined): number {
	if (!costs) return 0
	if (costs.totalOverride !== null) return costs.totalOverride
	return costs.items.reduce((sum, item) => sum + item.amount, 0)
}

export function getMonthlyRecurringTotal(recurring: RecurringIncome[]): number {
	return recurring.reduce((sum, r) => sum + r.rate * r.timesPerMonth, 0)
}

export function buildChartData(
	sessions: TutoringSession[],
	oneOffEntries: OneOffEntry[],
	recurring: RecurringIncome[],
	costs: MonthlyCosts | undefined,
	month: string
): { labels: string[]; earnings: number[]; burndown: number[]; breakdown: DayBreakdown[] } {
	const days = getDaysInMonth(month)
	const totalCost = getMonthlyCostTotal(costs)

	const monthSessions = sessions.filter((s) => s.date.startsWith(month))
	const monthOneOff = oneOffEntries.filter((e) => e.date.startsWith(month))

	const labels: string[] = []
	const earnings: number[] = []
	const burndown: number[] = []
	const breakdown: DayBreakdown[] = []

	let cumulativeTutoring = 0
	let cumulativeOneOff = 0

	for (let d = 1; d <= days; d++) {
		const fullDay = `${month}-${String(d).padStart(2, '0')}`

		for (const s of monthSessions) {
			if (s.date === fullDay) cumulativeTutoring += s.amount
		}
		for (const e of monthOneOff) {
			if (e.date === fullDay) cumulativeOneOff += e.amount
		}

		const recurringBreakdown = recurring.map((r) => ({
			name: r.name,
			value: parseFloat(((r.rate * r.timesPerMonth * d) / days).toFixed(2))
		}))
		const recurringTotal = recurringBreakdown.reduce((sum, r) => sum + r.value, 0)

		const totalEarnings = parseFloat(
			(cumulativeTutoring + cumulativeOneOff + recurringTotal).toFixed(2)
		)

		labels.push(String(d))
		earnings.push(totalEarnings)
		burndown.push(parseFloat(((totalCost / days) * d).toFixed(2)))
		breakdown.push({
			tutoring: parseFloat(cumulativeTutoring.toFixed(2)),
			recurring: recurringBreakdown,
			oneOff: parseFloat(cumulativeOneOff.toFixed(2))
		})
	}

	return { labels, earnings, burndown, breakdown }
}

export function getSummaryAsOfDay(
	sessions: TutoringSession[],
	oneOffEntries: OneOffEntry[],
	recurring: RecurringIncome[],
	costs: MonthlyCosts | undefined,
	month: string,
	day: number
): { earned: number; costs: number; net: number } {
	const days = getDaysInMonth(month)
	const cutoff = `${month}-${String(day).padStart(2, '0')}`

	const sessionTotal = sessions
		.filter((s) => s.date.startsWith(month) && s.date <= cutoff)
		.reduce((sum, s) => sum + s.amount, 0)

	const oneOffTotal = oneOffEntries
		.filter((e) => e.date.startsWith(month) && e.date <= cutoff)
		.reduce((sum, e) => sum + e.amount, 0)

	const recurringTotal = (getMonthlyRecurringTotal(recurring) * day) / days

	const earned = parseFloat((sessionTotal + oneOffTotal + recurringTotal).toFixed(2))
	const costsToDate = parseFloat(((getMonthlyCostTotal(costs) * day) / days).toFixed(2))

	return { earned, costs: costsToDate, net: parseFloat((earned - costsToDate).toFixed(2)) }
}

export function getSummaryStats(
	sessions: TutoringSession[],
	oneOffEntries: OneOffEntry[],
	recurring: RecurringIncome[],
	costs: MonthlyCosts | undefined,
	month: string
): { totalEarned: number; monthlyCosts: number; net: number } {
	const monthSessions = sessions.filter((s) => s.date.startsWith(month))
	const monthOneOff = oneOffEntries.filter((e) => e.date.startsWith(month))

	const sessionTotal = monthSessions.reduce((sum, s) => sum + s.amount, 0)
	const oneOffTotal = monthOneOff.reduce((sum, e) => sum + e.amount, 0)
	const recurringTotal = getMonthlyRecurringTotal(recurring)

	const totalEarned = sessionTotal + oneOffTotal + recurringTotal
	const monthlyCosts = getMonthlyCostTotal(costs)

	return {
		totalEarned: parseFloat(totalEarned.toFixed(2)),
		monthlyCosts: parseFloat(monthlyCosts.toFixed(2)),
		net: parseFloat((totalEarned - monthlyCosts).toFixed(2))
	}
}
