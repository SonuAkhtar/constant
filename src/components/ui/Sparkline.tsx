export function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const W = 88, H = 30
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W
      const y = H - (v / max) * (H - 4) - 2
      return `${x},${y}`
    })
    .join(' ')
  const rising = data[data.length - 1] >= data[0]
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      className="progress-page__sparkline"
    >
      <polyline
        points={pts}
        stroke={rising ? 'var(--color-success)' : 'var(--color-error)'}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  )
}
