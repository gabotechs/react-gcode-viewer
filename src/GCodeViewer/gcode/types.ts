export type LineType = 'extrude' | 'travel'

export interface GPoint {
  x: number
  y: number
  z: number
  e: number
  type: LineType
}
