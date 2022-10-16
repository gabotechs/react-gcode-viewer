import { GPoint } from './types'

const MOVE_DIRECTIVES = ['g0', 'g1'] as const

export function isMoveCmd (cmd: string): boolean {
  cmd = cmd.trim().slice(0, 2).toLowerCase()
  for (const directive of MOVE_DIRECTIVES) {
    if (cmd.startsWith(directive)) return true
  }
  return false
}

export function GPointFromCmd (cmd: string, prev: GPoint): GPoint {
  const point = { ...prev }
  cmd = cmd.split(';')[0]
  const tokens = cmd.split(/ +/g).map(t => t.toLocaleLowerCase())
  if (!MOVE_DIRECTIVES.includes(tokens[0] as any)) {
    throw new Error(tokens[0]+' is not a move directive')
  }
  let hasExtruded = false
  for (const token of tokens.slice(1)) {
    for (const axis of ['x', 'y', 'z', 'e'] as const) {
      if (token.startsWith(axis)) {
        point[axis] = Number(token.slice(1))
        if (axis === 'e' && point[axis] > 0) hasExtruded = true
        break
      }
    }
  }
  point.type = hasExtruded ? 'extrude':'travel'
  return point
}
