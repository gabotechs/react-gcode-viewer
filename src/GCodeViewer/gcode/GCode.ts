import { BaseReader } from "./reader";
import { GPoint } from "./types";
import { GPointFromCmd, isMoveCmd } from "./parser";

const MAX_QUALITY_RES = 10
const Z_DIM_THRESHOLD = .4
const BIG_NUM = 2**32
const LINE_SPLIT = "\n"

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

export interface GCodeOptions {
    quality?: number
}

export class GCode {
    private lastPoint: GPoint = {x: 0, y: 0, z: 0, e: 0, type: "travel"}
    public readonly layers: Record<number, GPoint[]> = {}

    public baseCenter?: {x: number, y: number} = undefined
    public limits = {
        max: {x: -BIG_NUM, y: -BIG_NUM, z: -BIG_NUM},
        min: {x: BIG_NUM, y: BIG_NUM, z: BIG_NUM}
    }
    public filament: number = 0
    public readonly opts: GCodeOptions
    private count: number = 0

    private readonly omitCycle: boolean[] = []
    private readonly qualityRes: number

    constructor(opts: GCodeOptions = {}) {
        this.opts = opts
        const quality = this.opts.quality || 1
        if (quality > 1 || quality < 0) throw new Error("quality must be between 0 and 1")
        const q = quality > .5 ? (1-quality):quality
        this.qualityRes = Math.min(Math.ceil(1 / q), MAX_QUALITY_RES)
        const n = Math.ceil(quality*this.qualityRes)
        for (let i = 0; i < this.qualityRes; i++) {
            this.omitCycle.push(i < n)
        }
    }

    public parse = async (reader: BaseReader, onProgress?: () => void) => {
        let prevCodeLine = ""
        while (true) {
            const chunk = await reader.read()
            if (!chunk) break
            const codeLines = chunk.split(LINE_SPLIT)
            codeLines[0] = prevCodeLine + codeLines[0]
            prevCodeLine = codeLines.pop() || ""
            this.parseCodeLines(codeLines)
            if (onProgress) onProgress()
            await sleep(0)
        }
    }

    private updateBaseCenter() {
        let accX = 0
        let accY = 0
        let count = 0
        const zs = Object.keys(this.layers).map(Number).sort()
        for (const z of zs) {
            if (z === 0) continue
            for (const point of this.layers[z]) {
                if (point.type !== "extrude") continue
                accX += point.x
                accY += point.y
                count++
            }
            break
        }
        if (count < 10) return
        this.baseCenter = {x: accX/count, y: accY/count}
    }

    private updateLimits(move: GPoint) {
        for (const axis of ["x", "y", "z"] as const) {
            if (move[axis] > this.limits.max[axis]) this.limits.max[axis] = move[axis]
            if (move[axis] < this.limits.min[axis]) this.limits.min[axis] = move[axis]
        }
        if (move.e && move.e > this.filament) this.filament = move.e
    }

    private parseCodeLines(codeLines: string[]) {
        for (const line of codeLines) {
            if (!isMoveCmd(line)) continue
            const point = GPointFromCmd(line, this.lastPoint)
            if (point.z > Z_DIM_THRESHOLD && !this.baseCenter) {
                this.updateBaseCenter()
            }
            this.lastPoint = point

            if (point.z > Z_DIM_THRESHOLD && point.type === "extrude") this.updateLimits(point)
            if (!this.layers[point.z]) this.layers[point.z] = []
            if (point.type === "travel") {
                this.layers[point.z].push(point)
                continue
            } else if (this.omitCycle[this.count % this.qualityRes]) {
                this.layers[point.z].push(point)
            }
            this.count++
        }
    }
}
