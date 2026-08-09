export type BitOperator = 'AND' | 'OR' | 'XOR' | 'NOT' | 'SHL' | 'SHR'

export type BitVisual = {
  bitWidth: number
  operator: BitOperator
  a: number
  b: number
  value?: number
  mask?: number
}

export type BitFrameKind = 'operands' | 'mask' | 'result' | 'shift'

export type BitCellRole = 'stable' | 'kept' | 'cleared' | 'born' | 'shifted'

export type BitFrameMotion =
  | 'none'
  | 'flip'
  | 'mask-filter'
  | 'shift-left'
  | 'shift-right'
  | 'merge'

export type BitFrameRow = {
  name: string
  value: number
  highlight?: boolean
  /** Previous value for FLIP / shift interpolation */
  fromValue?: number
  /** Per-bit role when mask/result animates */
  roles?: BitCellRole[]
}

export type BitFrame = {
  kind: BitFrameKind
  label: string
  motion: BitFrameMotion
  /** Horizontal bit displacement in cells (SHL positive = left visually for MSB-left) */
  shiftBy?: number
  rows: BitFrameRow[]
}

export type BitAnimation = {
  bitWidth: number
  frames: BitFrame[]
  result: number
}
