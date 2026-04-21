export type TutoringSession = {
	id: string
	date: string
	studentName: string
	status: 'Attended' | 'Missed' | 'Scheduled'
	startTime: string
	endTime: string
	hours: number
	amount: number
}

export type RecurringIncome = {
	id: string
	name: string
	rate: number
	timesPerMonth: number
}

export type OneOffEntry = {
	id: string
	date: string
	description: string
	amount: number
}

export type DayBreakdown = {
	tutoring: number
	recurring: { name: string; value: number }[]
	oneOff: number
}

export type CostItem = {
	id: string
	name: string
	amount: number
}

export type MonthlyCosts = {
	month: string
	totalOverride: number | null
	items: CostItem[]
}
