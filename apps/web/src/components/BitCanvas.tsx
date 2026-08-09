import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import type { BitFrame } from '../lib/bit-engine'
import { BitRow } from './BitRow'

type BitCanvasProps = {
  bitWidth: number
  frame: BitFrame
  frameIndex: number
  frameCount: number
}

export function BitCanvas({
  bitWidth,
  frame,
  frameIndex,
  frameCount,
}: BitCanvasProps) {
  const reduceMotion = usePrefersReducedMotion()
  const animKey = `${frame.kind}-${frameIndex}-${frame.label}`

  return (
    <section
      className={`bit-canvas bit-canvas--${frame.motion}`}
      aria-live="polite"
    >
      <header className="bit-canvas__header">
        <div>
          <p className="bit-canvas__kicker">Registro visual</p>
          <p className="bit-canvas__label">{frame.label}</p>
        </div>
        <p className="bit-canvas__progress" data-testid="frame-indicator">
          Frame {frameIndex + 1}/{frameCount}
        </p>
      </header>
      <div className="bit-canvas__track" aria-hidden="true">
        {Array.from({ length: bitWidth }, (_, i) => (
          <span key={i} className="bit-canvas__tick">
            {bitWidth - 1 - i}
          </span>
        ))}
      </div>
      <div className="bit-canvas__rows">
        {frame.rows.map((row) => (
          <BitRow
            key={`${animKey}-${row.name}`}
            name={row.name}
            value={row.value}
            bitWidth={bitWidth}
            highlight={row.highlight}
            fromValue={row.fromValue}
            roles={row.roles}
            motion={frame.motion}
            shiftBy={frame.shiftBy}
            animKey={animKey}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </section>
  )
}
