import { BaseReader } from './base'

const DEFAULT_CHUNK_SIZE = 1024**2
const DEFAULT_WAIT_MS = 0

export interface StringReaderOptions {
  file: string | File
  chunkSize?: number
  waitMs?: number
}

export default class StringReader implements BaseReader {
  private cursor: number = 0
  private text: string = ''
  private readonly opts: StringReaderOptions
  constructor (opts: StringReaderOptions) {
    this.opts = opts
  }

  async read (): Promise<string | null> {
    if (this.text === '') {
      this.text = typeof this.opts.file === 'string'
        ? this.opts.file
        : await this.opts.file.text()
    }

    if (this.cursor >= this.text.length) return Promise.resolve(null)
    const cursor = this.cursor
    this.cursor += this.opts.chunkSize ?? DEFAULT_CHUNK_SIZE
    return await new Promise<string | null>(resolve => setTimeout(
      () => resolve(this.text.slice(cursor, (this.opts.chunkSize ?? DEFAULT_CHUNK_SIZE) + cursor)),
      this.opts.waitMs ?? DEFAULT_WAIT_MS
    ))
  }
}
