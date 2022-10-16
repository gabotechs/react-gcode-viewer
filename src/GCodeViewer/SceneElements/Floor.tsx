import React from 'react'
import { GroupProps } from '@react-three/fiber'

export interface FloorProps extends GroupProps {
  visible?: boolean
  width?: number
  length?: number
  noShadow?: boolean
}

const Floor: React.FC<FloorProps> = (
  {
    visible = false,
    width,
    length,
    ...otherProps
  }
) => {
  const position: [number, number, number] = [
    (width ?? 0)/2+0.1,
    (length ?? 0)/2+0.1,
    0
  ]
  const planeArgs: [number, number, number, number] = [
    width ?? 0,
    length ?? 0,
    Math.floor((width ?? 20) / 20),
    Math.floor((length ?? 20) / 20)
  ]
  if (!visible) return null
  return (
        <group {...otherProps} >
            {width != null && length != null && <mesh position={position}>
                <planeGeometry args={planeArgs}/>
                <meshStandardMaterial wireframe={true} opacity={0.2}/>
            </mesh>}
        </group>
  )
}

export default Floor
