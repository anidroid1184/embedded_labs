import { applyOperator, clampBits, toBitArray } from './ops'
import type {
  BitAnimation,
  BitCellRole,
  BitFrame,
  BitFrameMotion,
  BitVisual,
} from './types'

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

export function buildAnimation(visual: BitVisual): BitAnimation {
  const bitWidth = visual.bitWidth
  const isMask = visual.mask !== undefined || visual.value !== undefined

  if (isMask) {
    const value = clampBits(visual.value ?? visual.a, bitWidth)
    const mask = clampBits(visual.mask ?? visual.b, bitWidth)
    const result = applyOperator('AND', value, mask, bitWidth)
    return {
      bitWidth,
      result,
      frames: [
        frame('operands', 'Valor original', 'none', [{ name: 'value', value }]),
        frame('mask', 'Máscara se alinea', 'mask-filter', [
          { name: 'value', value, fromValue: value },
          { name: 'mask', value: mask, highlight: true, fromValue: 0 },
        ]),
        frame('result', 'Bits filtrados (AND máscara)', 'mask-filter', [
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
        frame('operands', 'Operando A', 'none', [{ name: 'A', value: a }]),
        frame('result', 'NOT invierte cada bit', 'flip', [
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
        frame('operands', 'Registro listo para desplazar', 'none', [
          { name: 'A', value: a },
        ]),
        frame(
          'shift',
          `${visual.operator} ${shiftBy} — bits en movimiento`,
          motion,
          [
            {
              name: 'A',
              value: result,
              highlight: true,
              fromValue: a,
            },
          ],
          shiftBy,
        ),
        frame('result', 'Nuevo valor del registro', 'flip', [
          {
            name: 'result',
            value: result,
            highlight: true,
            fromValue: a,
          },
        ]),
      ],
    }
  }

  return {
    bitWidth,
    result,
    frames: [
      frame('operands', `Operandos · ${visual.operator}`, 'none', [
        { name: 'A', value: a },
        { name: 'B', value: b },
      ]),
      frame('result', `A ${visual.operator} B → resultado`, 'merge', [
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
