import type { CSSProperties } from 'react'

import { toBitArray } from '../lib/bit-engine'
import type { BitCellRole, BitFrameMotion } from '../lib/bit-engine/types'

type BitRowProps = {
  name: string
  value: number
  bitWidth: number
  highlight?: boolean
  fromValue?: number
  roles?: BitCellRole[]
  motion?: BitFrameMotion
  shiftBy?: number
  animKey: string
  reduceMotion?: boolean
}

function shiftOffsetPx(
  motion: BitFrameMotion,
  shiftBy: number,
  cellPitch: number,
): number {
  if (shiftBy <= 0) return 0
  if (motion === 'shift-left') return shiftBy * cellPitch
  if (motion === 'shift-right') return -shiftBy * cellPitch
  return 0
}

export function BitRow({
  name,
  value,
  bitWidth,
  highlight = false,
  fromValue,
  roles,
  motion = 'none',
  shiftBy = 0,
  animKey,
  reduceMotion = false,
}: BitRowProps) {
  const bits = toBitArray(value, bitWidth)
  const prevBits =
    fromValue === undefined ? bits : toBitArray(fromValue, bitWidth)
  const cellPitch = 40
  const startOffset = reduceMotion ? 0 : shiftOffsetPx(motion, shiftBy, cellPitch)

  return (
    <div
      className={`bit-row${highlight ? ' bit-row--highlight' : ''}`}
      data-motion={motion}
    >
      <div className="bit-row__meta">
        <span className="bit-row__name">{name}</span>
        <span className="bit-row__hex">
          0x{value.toString(16).toUpperCase().padStart(Math.ceil(bitWidth / 4), '0')}
        </span>
      </div>
      <div
        className="bit-row__bits"
        aria-label={`${name} bits`}
        style={{ '--bit-start-x': `${startOffset}px` } as CSSProperties}
      >
        {bits.map((bit, index) => {
          const prev = prevBits[index] ?? 0
          const role = roles?.[index] ?? (bit !== prev ? 'born' : 'stable')
          const flipped = bit !== prev
          return (
            <span
              key={`${animKey}-${name}-${bitWidth - 1 - index}`}
              className={[
                'bit-cell',
                bit === 1 ? 'bit-cell--on' : 'bit-cell--off',
                `bit-cell--${role}`,
                flipped ? 'bit-cell--flipped' : '',
                motion === 'shift-left' || motion === 'shift-right'
                  ? 'bit-cell--sliding'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-bit={bit}
              style={{ '--bit-delay': `${index * 45}ms` } as CSSProperties}
            >
              {bit}
            </span>
          )
        })}
      </div>
    </div>
  )
}
