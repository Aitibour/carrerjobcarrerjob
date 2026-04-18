'use client'
import { useEffect, useRef, useState } from 'react'

const stats = [
  { value: 10, suffix: 's', label: 'CV upload time' },
  { value: 95, suffix: '%', label: 'Max match score' },
  { value: 1, suffix: '-click', label: 'Tailored CV' },
  { value: 0, suffix: 'Free', label: 'No credit card', isFree: true },
]

function useCountUp(target: number, duration = 1200, started: boolean) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!started || target === 0) { setCount(target); return }
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [started, target, duration])
  return count
}

function StatItem({ stat, started, delay }: { stat: typeof stats[0]; started: boolean; delay: number }) {
  const count = useCountUp(stat.isFree ? 0 : stat.value, 1200, started)
  return (
    <div
      className="text-center transition-all duration-700"
      style={{
        opacity: started ? 1 : 0,
        transform: started ? 'translateY(0)' : 'translateY(16px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      <div className="text-3xl font-black text-blue-600">
        {stat.isFree ? 'Free' : `${count}${stat.suffix}`}
      </div>
      <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
    </div>
  )
}

export default function AnimatedStats() {
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
      {stats.map((s, i) => (
        <StatItem key={s.label} stat={s} started={started} delay={i * 150} />
      ))}
    </div>
  )
}
