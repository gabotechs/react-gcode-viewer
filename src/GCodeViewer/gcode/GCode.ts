import { BaseReader } from './reader'
import { GPoint } from './types'
import { GPointFromCmd, isMoveCmd } from './parser'

const MAX_QUALITY_RES = 10
const Z_BASE_CENTER_CALC_THRESHOLD = 0.4
const Z_LIMITS_CALC_THRESHOLD = 0.4
const BIG_NUM = 2**32
const LINE_SPLIT = '\n'

const sleep = async (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export interface GCodeParseProgress {
  points: GPoint[]
  read: number
  baseCenter: { x: number, y: number }
  max: { x: number, y: number, z: number }
  min: { x: number, y: number, z: number }
  filamentLength: number
}

export interface GCodeOptions {
  quality?: number
  onProgress?: (progress: GCodeParseProgress) => any
  onFinished?: (finished: GCodeParseProgress) => any
}

export class GCode {
  private lastPoint: GPoint = { x: 0, y: 0, z: 0, e: 0, type: 'travel' }
  public readonly points: GPoint[] = []

  public baseCenter?: { x: number, y: number } = undefined
  public limits = {
    max: { x: 0, y: 0, z: 0 },
    min: { x: BIG_NUM, y: BIG_NUM, z: 0 }
  }

  private readonly opts: GCodeOptions
  public filament: number = 0
  private read = 0
  private count = 0
  private _abort = false

  private readonly omitCycle: boolean[] = []
  private readonly qualityRes: number

  constructor (opts: GCodeOptions = {}) {
    this.opts = opts
    const quality = opts.quality ?? 1
    if (quality > 1 || quality < 0) throw new Error('quality must be between 0 and 1')
    const q = quality > 0.5 ? (1-quality):quality
    this.qualityRes = Math.min(Math.ceil(1 / q), MAX_QUALITY_RES)
    const n = Math.ceil(quality*this.qualityRes)
    for (let i = 0; i < this.qualityRes; i++) {
      this.omitCycle.push(i < n)
    }
  }

  abort = (): void => {
    this._abort = true
  }

  private getProgress (): GCodeParseProgress {
    return {
      points: this.points,
      read: this.read,
      baseCenter: (this.baseCenter != null) ? { ...this.baseCenter }:{ x: 0, y: 0 },
      max: { ...this.limits.max },
      min: { ...this.limits.min },
      filamentLength: this.filament
    }
  }

  public parse = async (reader: BaseReader): Promise<void> => {
    let prevCodeLine = ''
    this.read = 0
    while (!this._abort) {
      const chunk = await reader.read()
      if (chunk == null) break
      this.read += chunk.length
      const codeLines = chunk.split(LINE_SPLIT)
      codeLines[0] = prevCodeLine + codeLines[0]
      prevCodeLine = codeLines.pop() ?? ''
      this.parseCodeLines(codeLines)
      if (this.opts.onProgress != null) this.opts.onProgress(this.getProgress())
      await sleep(0)
    }
    if (this.opts.onFinished != null) this.opts.onFinished(this.getProgress())
  }

  private updateBaseCenter (): void {
    let accX = 0
    let accY = 0
    let count = 0
    for (const point of this.points) {
      if (point.type !== 'extrude') continue
      accX += point.x
      accY += point.y
      count++
    }
    if (count < 10) return
    this.baseCenter = { x: accX/count, y: accY/count }
  }

  private updateLimits (move: GPoint): void {
    for (const axis of ['x', 'y', 'z'] as const) {
      if (move[axis] > this.limits.max[axis]) this.limits.max[axis] = move[axis]
      if (move[axis] < this.limits.min[axis]) this.limits.min[axis] = move[axis]
    }
    if ((move.e !== 0) && move.e > this.filament) this.filament = move.e
  }

  private parseCodeLines (codeLines: string[]): void {
    for (const line of codeLines) {
      if (!isMoveCmd(line)) continue
      const point = GPointFromCmd(line, this.lastPoint)

      if (point.z > Z_BASE_CENTER_CALC_THRESHOLD && (this.baseCenter == null)) this.updateBaseCenter()
      if (point.z > Z_LIMITS_CALC_THRESHOLD && point.type === 'extrude') this.updateLimits(point)

      this.lastPoint = point

      if (point.type === 'travel') {
        this.points.push(point)
        continue
      } else if (this.omitCycle[this.count % this.qualityRes]) {
        this.points.push(point)
      }
      this.count++
    }
  }
}
