import type { TutoringSession } from '$lib/types'

const SESSION_BLOCK =
	/^(\d{4}-\d{2}-\d{2})\s*\n([^\t\n]+)\n\t(Attended|Missed|Scheduled)\s+\t([\d:]+\s+[AP]M)\s+\t([\d:]+\s+[AP]M)\s+\t([\d.]+)\s+\t\$([\d.]+)/gm

export function parseTutoringSessions(raw: string): TutoringSession[] {
	const cleaned = raw.replace(/\r/g, '')
	const results: TutoringSession[] = []
	let match: RegExpExecArray | null

	SESSION_BLOCK.lastIndex = 0
	while ((match = SESSION_BLOCK.exec(cleaned)) !== null) {
		const [, date, studentName, status, startTime, endTime, hours, amount] = match
		results.push({
			id: crypto.randomUUID(),
			date,
			studentName: studentName.trim(),
			status: status as 'Attended' | 'Missed',
			startTime: startTime.trim(),
			endTime: endTime.trim(),
			hours: parseFloat(hours),
			amount: parseFloat(amount)
		})
	}

	return results
}
