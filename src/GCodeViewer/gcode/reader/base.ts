export interface BaseReader {
  read: () => Promise<string | null>
}
