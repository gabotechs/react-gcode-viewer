import fs from 'fs'
import path from 'path'
import { GCode } from '../GCode'
import StringReader from '../reader/StringReader'

describe('gcode file is loaded', function () {
  it('should be parsed properly', async function () {
    const file = fs.readFileSync(path.join(__dirname, '/test.gcode'))
    const gCode = new GCode()
    await gCode.parse(new StringReader({ file: file.toString() }))
    expect(gCode.points.length).toEqual(7)
  })
})
