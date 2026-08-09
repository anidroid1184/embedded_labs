import { useEffect, useState } from 'react'

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { toBitArray } from '../lib/bit-engine'

const PATTERN = 0b10110100

export function HeroBits() {
  const reduceMotion = usePrefersReducedMotion()
  const [value, setValue] = useState(PATTERN)
  const [shifted, setShifted] = useState(false)

  useEffect(() => {
    if (reduceMotion) return
    const id = window.setInterval(() => {
      setShifted((prev) => !prev)
      setValue((current) => {
        const next = ((current << 1) | (current >> 7)) & 0xff
        return next
      })
    }, 1200)
    return () => window.clearInterval(id)
  }, [reduceMotion])

  const bits = toBitArray(value, 8)

  return (
    <div
      className={`hero-bits${shifted ? ' hero-bits--pulse' : ''}`}
      aria-hidden="true"
    >
      <div className="hero-bits__label">
        <span>live register</span>
        <span>0x{value.toString(16).toUpperCase().padStart(2, '0')}</span>
      </div>
      <div className="hero-bits__row">
        {bits.map((bit, index) => (
          <span
            key={`${value}-${index}`}
            className={`hero-bits__cell${bit === 1 ? ' is-on' : ''}`}
            style={{ animationDelay: `${index * 40}ms` }}
          >
            {bit}
          </span>
        ))}
      </div>
    </div>
  )
}
