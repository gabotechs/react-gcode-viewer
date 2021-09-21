import fs from "fs"
import GCode from "../GCode";
import StringReader from "../reader/StringReader";

describe('gcode file is loaded', function () {
    it('should be parsed properly', async function () {
        const file = fs.readFileSync(__dirname+"/test.gcode")
        const gCode = new GCode()
        await gCode.parse(new StringReader({file: file.toString()}))
        expect(gCode.layers[0.2].length).toEqual(4)
    });
});
