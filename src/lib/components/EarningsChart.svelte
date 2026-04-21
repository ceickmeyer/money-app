<script lang="ts">
	import { browser } from '$app/environment'
	import { onMount } from 'svelte'
	import type { DayBreakdown } from '$lib/types'

	type Props = {
		labels: string[]
		earnings: number[]
		burndown: number[]
		breakdown: DayBreakdown[]
		todayDay: number | null
	}

	let { labels, earnings, burndown, breakdown, todayDay }: Props = $props()

	let canvasEl = $state<HTMLCanvasElement | undefined>(undefined)
	let chart: import('chart.js').Chart | undefined

	// Mutable refs so callbacks always read latest values
	const refs = {
		breakdown: [] as DayBreakdown[],
		todayDay: null as number | null
	}

	const todayLinePlugin = {
		id: 'todayLine',
		afterDraw(ch: import('chart.js').Chart) {
			const day = refs.todayDay
			if (day == null) return
			const labels = ch.data.labels
			if (!labels || day - 1 >= labels.length) return

			const xAxis = ch.scales['x']
			const x = xAxis.getPixelForValue(day - 1)
			const { top, bottom } = ch.chartArea
			const ctx = ch.ctx

			ctx.save()
			ctx.beginPath()
			ctx.moveTo(x, top)
			ctx.lineTo(x, bottom)
			ctx.lineWidth = 1.5
			ctx.strokeStyle = 'rgba(107,114,128,0.55)'
			ctx.setLineDash([4, 3])
			ctx.stroke()

			ctx.fillStyle = 'rgba(107,114,128,0.75)'
			ctx.font = 'bold 10px sans-serif'
			ctx.textAlign = 'center'
			ctx.fillText('Today', x, top - 3)
			ctx.restore()
		}
	}

	onMount(() => {
		let cancelled = false

		import('chart.js').then(
			({
				Chart,
				LineController,
				LineElement,
				PointElement,
				LinearScale,
				CategoryScale,
				Legend,
				Tooltip,
				Filler
			}) => {
				if (cancelled || !canvasEl) return

				Chart.register(
					LineController,
					LineElement,
					PointElement,
					LinearScale,
					CategoryScale,
					Legend,
					Tooltip,
					Filler
				)

				chart = new Chart(canvasEl, {
					type: 'line',
					plugins: [todayLinePlugin],
					data: {
						labels,
						datasets: [
							{
								label: 'Earnings',
								data: earnings,
								borderColor: '#3b82f6',
								backgroundColor: 'rgba(59,130,246,0.1)',
								tension: 0.3,
								fill: true,
								pointRadius: 2
							},
							{
								label: 'Monthly Costs',
								data: burndown,
								borderColor: '#ef4444',
								borderDash: [5, 5],
								backgroundColor: 'transparent',
								tension: 0,
								fill: false,
								pointRadius: 0
							}
						]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						interaction: { mode: 'index', intersect: false },
						plugins: {
							legend: { position: 'top', labels: { boxWidth: 12, font: { size: 12 } } },
							tooltip: {
								callbacks: {
									label(item) {
										const idx = item.dataIndex
										const y = item.parsed.y ?? 0
										if (item.dataset.label === 'Monthly Costs') {
											return `  Costs: $${y.toFixed(2)}`
										}
										const b = refs.breakdown[idx]
										if (!b) return `  Total: $${y.toFixed(2)}`

										const lines: string[] = []
										lines.push(`  Total: $${y.toFixed(2)}`)
										if (b.tutoring > 0) lines.push(`  ├ Tutoring: $${b.tutoring.toFixed(2)}`)
										for (const r of b.recurring) {
											if (r.value > 0) lines.push(`  ├ ${r.name}: $${r.value.toFixed(2)}`)
										}
										if (b.oneOff > 0) lines.push(`  └ One-off: $${b.oneOff.toFixed(2)}`)
										return lines
									},
									afterBody(items) {
										if (!items.length) return []
										const e = items.find((i) => i.dataset.label === 'Earnings')?.parsed.y ?? 0
										const c = items.find((i) => i.dataset.label === 'Monthly Costs')?.parsed.y ?? 0
										const net = e - c
										const sign = net >= 0 ? '+' : ''
										return [`  ─────────────────`, `  Net: ${sign}$${net.toFixed(2)}`]
									}
								}
							}
						},
						scales: {
							x: {
								ticks: { font: { size: 11 }, maxTicksLimit: 10 }
							},
							y: {
								beginAtZero: true,
								ticks: { font: { size: 11 }, callback: (val) => `$${val}` }
							}
						}
					}
				})
			}
		)

		return () => {
			cancelled = true
			chart?.destroy()
		}
	})

	$effect(() => {
		refs.breakdown = breakdown
		refs.todayDay = todayDay
		if (!chart) return
		chart.data.labels = labels
		chart.data.datasets[0].data = earnings
		chart.data.datasets[1].data = burndown
		chart.update()
	})
</script>

{#if browser}
	<div class="relative h-64 w-full">
		<canvas bind:this={canvasEl}></canvas>
	</div>
{:else}
	<div class="h-64 animate-pulse rounded-lg bg-gray-200"></div>
{/if}
