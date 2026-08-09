import type { BitOperator } from './types'

export function maskForWidth(bitWidth: number): number {
  if (bitWidth <= 0 || bitWidth > 32) {
    throw new Error(`unsupported bitWidth: ${bitWidth}`)
  }
  return bitWidth === 32 ? 0xffff_ffff : (1 << bitWidth) - 1
}

export function clampBits(value: number, bitWidth: number): number {
  return (value >>> 0) & maskForWidth(bitWidth)
}

export function applyOperator(
  operator: BitOperator,
  a: number,
  b: number,
  bitWidth: number,
): number {
  const left = clampBits(a, bitWidth)
  const right = clampBits(b, bitWidth)
  const widthMask = maskForWidth(bitWidth)

  switch (operator) {
    case 'AND':
      return left & right
    case 'OR':
      return left | right
    case 'XOR':
      return left ^ right
    case 'NOT':
      return (~left) & widthMask
    case 'SHL':
      return (left << right) & widthMask
    case 'SHR':
      return (left >>> right) & widthMask
    default: {
      const _exhaustive: never = operator
      throw new Error(`unknown operator: ${_exhaustive}`)
    }
  }
}

export function toBitArray(value: number, bitWidth: number): number[] {
  const clamped = clampBits(value, bitWidth)
  const bits: number[] = []
  for (let i = bitWidth - 1; i >= 0; i -= 1) {
    bits.push((clamped >> i) & 1)
  }
  return bits
}
