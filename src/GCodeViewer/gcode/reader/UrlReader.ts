import { BaseReader } from './base'

const DEFAULT_CHUNK_SIZE = 1024*64

export interface UrlReaderOptions {
  chunkSize?: number
  url: string
  reqOptions?: RequestInit
}

export default class UrlReader implements BaseReader {
  private readonly opts: UrlReaderOptions
  private text: string = ''
  private finished: boolean = false
  private reader?: ReadableStreamDefaultReader<Uint8Array>
  constructor (opts: UrlReaderOptions) {
    this.opts = opts
  }

  async read (): Promise<string | null> {
    const chunkSize = this.opts.chunkSize ?? DEFAULT_CHUNK_SIZE
    if (this.finished) return null
    if (this.reader == null) {
      const r = await fetch(this.opts.url, this.opts.reqOptions)
      if (r.body == null) throw new Error('no body in response')
      this.reader = r.body.getReader()
    }
    const decoder = new TextDecoder()
    while (this.text.length < chunkSize) {
      const { value, done } = await this.reader.read()
      if (done || value === undefined) {
        break
      } else {
        this.text += decoder.decode(value)
      }
    }
    if (this.text.length >= chunkSize) {
      const toReturn = this.text.slice(0, chunkSize)
      this.text = this.text.slice(chunkSize)
      return toReturn
    } else {
      const toReturn = this.text
      this.text = ''
      this.finished = true
      return toReturn
    }
  }
}
