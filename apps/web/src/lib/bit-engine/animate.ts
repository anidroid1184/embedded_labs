import { applyOperator, clampBits, toBitArray } from './ops'
import type {
  BitAnimation,
  BitCellRole,
  BitFrame,
  BitFrameMotion,
  BitVisual,
} from './types'

export type FrameLabelFn = (key: string, vars?: Record<string, string | number>) => string

function rolesForMask(value: number, mask: number, bitWidth: number): BitCellRole[] {
  const valueBits = toBitArray(value, bitWidth)
  const maskBits = toBitArray(mask, bitWidth)
  return valueBits.map((bit, i) => {
    if (maskBits[i] === 1 && bit === 1) return 'kept'
    if (maskBits[i] === 0 && bit === 1) return 'cleared'
    if (maskBits[i] === 1) return 'stable'
    return 'cleared'
  })
}

function rolesForMerge(
  a: number,
  b: number,
  result: number,
  bitWidth: number,
): BitCellRole[] {
  const aBits = toBitArray(a, bitWidth)
  const bBits = toBitArray(b, bitWidth)
  const rBits = toBitArray(result, bitWidth)
  return rBits.map((bit, i) => {
    if (bit === 1 && (aBits[i] === 1 || bBits[i] === 1)) return 'born'
    if (bit === 0 && (aBits[i] === 1 || bBits[i] === 1)) return 'cleared'
    return 'stable'
  })
}

function frame(
  kind: BitFrame['kind'],
  label: string,
  motion: BitFrameMotion,
  rows: BitFrame['rows'],
  shiftBy = 0,
): BitFrame {
  return { kind, label, motion, rows, shiftBy }
}

const defaultLabels: FrameLabelFn = (key, vars) => {
  const map: Record<string, string> = {
    'frame.operands': `Operands · ${vars?.op ?? ''}`,
    'frame.result': `A ${vars?.op ?? ''} B → result`,
    'frame.value': 'Original value',
    'frame.maskAlign': 'Mask aligns',
    'frame.maskResult': 'Filtered bits (AND mask)',
    'frame.notOperand': 'Operand A',
    'frame.notResult': 'NOT flips every bit',
    'frame.shiftReady': 'Register ready to shift',
    'frame.shiftMoving': `${vars?.op ?? ''} ${vars?.n ?? ''} — bits in motion`,
    'frame.shiftDone': 'New register value',
  }
  return map[key] ?? key
}

export function buildAnimation(
  visual: BitVisual,
  labelFn: FrameLabelFn = defaultLabels,
): BitAnimation {
  const bitWidth = visual.bitWidth
  const isMask = visual.mask !== undefined || visual.value !== undefined
  const t = labelFn

  if (isMask) {
    const value = clampBits(visual.value ?? visual.a, bitWidth)
    const mask = clampBits(visual.mask ?? visual.b, bitWidth)
    const result = applyOperator('AND', value, mask, bitWidth)
    return {
      bitWidth,
      result,
      frames: [
        frame('operands', t('frame.value'), 'none', [{ name: 'value', value }]),
        frame('mask', t('frame.maskAlign'), 'mask-filter', [
          { name: 'value', value, fromValue: value },
          { name: 'mask', value: mask, highlight: true, fromValue: 0 },
        ]),
        frame('result', t('frame.maskResult'), 'mask-filter', [
          {
            name: 'result',
            value: result,
            highlight: true,
            fromValue: value,
            roles: rolesForMask(value, mask, bitWidth),
          },
        ]),
      ],
    }
  }

  const a = clampBits(visual.a, bitWidth)
  const b = clampBits(visual.b, bitWidth)
  const result = applyOperator(visual.operator, a, b, bitWidth)

  if (visual.operator === 'NOT') {
    return {
      bitWidth,
      result,
      frames: [
        frame('operands', t('frame.notOperand'), 'none', [{ name: 'A', value: a }]),
        frame('result', t('frame.notResult'), 'flip', [
          {
            name: 'result',
            value: result,
            highlight: true,
            fromValue: a,
            roles: toBitArray(result, bitWidth).map((bit, i) =>
              bit !== toBitArray(a, bitWidth)[i] ? 'born' : 'stable',
            ),
          },
        ]),
      ],
    }
  }

  if (visual.operator === 'SHL' || visual.operator === 'SHR') {
    const motion: BitFrameMotion =
      visual.operator === 'SHL' ? 'shift-left' : 'shift-right'
    const shiftBy = clampBits(b, bitWidth)
    return {
      bitWidth,
      result,
      frames: [
        frame('operands', t('frame.shiftReady'), 'none', [{ name: 'A', value: a }]),
        frame(
          'shift',
          t('frame.shiftMoving', { op: visual.operator, n: shiftBy }),
          motion,
          [{ name: 'A', value: result, highlight: true, fromValue: a }],
          shiftBy,
        ),
        frame('result', t('frame.shiftDone'), 'flip', [
          { name: 'result', value: result, highlight: true, fromValue: a },
        ]),
      ],
    }
  }

  return {
    bitWidth,
    result,
    frames: [
      frame('operands', t('frame.operands', { op: visual.operator }), 'none', [
        { name: 'A', value: a },
        { name: 'B', value: b },
      ]),
      frame('result', t('frame.result', { op: visual.operator }), 'merge', [
        { name: 'A', value: a, fromValue: a },
        { name: 'B', value: b, fromValue: b },
        {
          name: 'result',
          value: result,
          highlight: true,
          fromValue: 0,
          roles: rolesForMerge(a, b, result, bitWidth),
        },
      ]),
    ],
  }
}
