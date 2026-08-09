import { describe, expect, it } from 'vitest'

import { applyOperator, buildAnimation, toBitArray } from './index'

describe('bit-engine', () => {
  it('applies AND/OR/XOR/NOT within 8 bits', () => {
    expect(applyOperator('AND', 0b11001011, 0b00111100, 8)).toBe(0b00001000)
    expect(applyOperator('OR', 0b10000000, 0b00001111, 8)).toBe(0b10001111)
    expect(applyOperator('XOR', 0b10101010, 0b11111111, 8)).toBe(0b01010101)
    expect(applyOperator('NOT', 0b00001111, 0, 8)).toBe(0b11110000)
  })

  it('builds mask animation frames before -> mask -> result', () => {
    const animation = buildAnimation({
      bitWidth: 8,
      operator: 'AND',
      a: 0,
      b: 0,
      value: 0b10111001,
      mask: 0b00111000,
    })
    expect(animation.frames).toHaveLength(3)
    expect(animation.frames[0]?.kind).toBe('operands')
    expect(animation.frames[1]?.kind).toBe('mask')
    expect(animation.frames[2]?.kind).toBe('result')
    expect(animation.result).toBe(0b00111000)
  })

  it('exports MSB-first bit arrays', () => {
    expect(toBitArray(0b10110000, 8)).toEqual([1, 0, 1, 1, 0, 0, 0, 0])
  })

  it('builds SHL frames with shift-left motion', () => {
    const animation = buildAnimation({
      bitWidth: 8,
      operator: 'SHL',
      a: 0b00101101,
      b: 2,
    })
    expect(animation.frames).toHaveLength(3)
    expect(animation.frames[1]?.motion).toBe('shift-left')
    expect(animation.frames[1]?.shiftBy).toBe(2)
    expect(animation.result).toBe(0b10110100)
  })
})
