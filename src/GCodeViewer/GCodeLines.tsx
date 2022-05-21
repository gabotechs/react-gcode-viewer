import React, { useCallback, useLayoutEffect, useRef } from "react";
import "@react-three/fiber"
import * as THREE from "three"
import { BufferGeometry } from "three"
import { GPoint, LineType } from "./gcode/types";
import { LineDashedMaterialProps } from "@react-three/fiber";


export interface GCodeLineProps extends LineDashedMaterialProps {
    points: GPoint[]
    showTravel?: boolean
}

function GCodeLines(
    {
        points,
        showTravel = false,
        ...otherProps
    }: GCodeLineProps) {
    const extrudeRef = useRef<BufferGeometry>()
    const travelRef = useRef<BufferGeometry>()

    const setLines = useCallback((geometry: BufferGeometry, type: LineType) => {
        const indices: number[] = []
        for (let i = 1; i < points.length; i++) {
            if (points[i].type === type) {
                indices.push(i-1, i)
            }
        }
        const coords = points.map(({x, y, z}) => new THREE.Vector3(x, y, z))
        geometry.setFromPoints(coords)
        geometry.setIndex(indices)
    }, [points])

    useLayoutEffect(() => {
        if (extrudeRef.current) setLines(extrudeRef.current, "extrude")
        if (travelRef.current) setLines(travelRef.current, "travel")
    }, [setLines])
    return (
        <>
            <lineSegments>
                <bufferGeometry ref={extrudeRef}/>
                <lineDashedMaterial
                    attach={"material"}
                    {...otherProps}
                />
            </lineSegments>
            {showTravel &&
            <lineSegments>
                <bufferGeometry ref={travelRef}/>
                <lineDashedMaterial
                    attach={"material"}
                />
            </lineSegments>}
        </>

    )
}

export default GCodeLines
