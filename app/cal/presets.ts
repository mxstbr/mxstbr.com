import type { colors } from './data'

import type { Border } from './data'

import type { BackgroundPattern } from './data'

// Define preset types
export type Preset = {
  name: string
  color: keyof typeof colors
  background: BackgroundPattern
  border: Border | ''
}

// Define presets
export const PRESETS: Preset[] = [
  {
    name: 'Kids',
    color: 'green',
    background: 'texture',
    border: 'solid',
  },
  {
    name: 'Minmax',
    color: 'yellow',
    background: 'diagonalLines',
    border: 'solid',
  },
  {
    name: 'Max',
    color: 'pink',
    background: 'diagonalLines',
    border: 'solid',
  },
  {
    name: 'Minnie',
    color: 'blue',
    background: 'texture',
    border: 'solid',
  },
]
