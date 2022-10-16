import React, { useCallback, useLayoutEffect, useRef } from 'react'
import { LineDashedMaterialProps } from '@react-three/fiber'
import * as THREE from 'three'
import { BufferGeometry } from 'three'
import { GPoint, LineType } from './gcode/types'

export interface GCodeLineProps extends LineDashedMaterialProps {
  points: GPoint[]
  showTravel?: boolean
}

const GCodeLines: React.FC<GCodeLineProps> = (
  {
    points,
    showTravel = false,
    ...otherProps
  }
) => {
  const extrudeRef = useRef<BufferGeometry>(null)
  const travelRef = useRef<BufferGeometry>(null)

  const setLines = useCallback((geometry: BufferGeometry, type: LineType) => {
    const indices: number[] = []
    for (let i = 1; i < points.length; i++) {
      if (points[i].type === type) {
        indices.push(i-1, i)
      }
    }
    const coords = points.map(({ x, y, z }) => new THREE.Vector3(x, y, z))
    geometry.setFromPoints(coords)
    geometry.setIndex(indices)
  }, [points])

  useLayoutEffect(() => {
    if (extrudeRef.current != null) setLines(extrudeRef.current, 'extrude')
    if (travelRef.current != null) setLines(travelRef.current, 'travel')
  }, [setLines])
  return (
        <>
            <lineSegments>
                <bufferGeometry ref={extrudeRef}/>
                <lineDashedMaterial
                    attach={'material'}
                    {...otherProps}
                />
            </lineSegments>
            {showTravel &&
            <lineSegments>
                <bufferGeometry ref={travelRef}/>
                <lineDashedMaterial
                    attach={'material'}
                />
            </lineSegments>}
        </>

  )
}

export default GCodeLines
