import React from "react"
import { GroupProps } from "@react-three/fiber";

export interface FloorProps extends GroupProps {
    visible?: boolean
    width?: number
    length?: number
    noShadow?: boolean
}

const Floor: React.FC<FloorProps> = (
    {
        visible,
        width = 0,
        length = 0,
        ...otherProps
    }
) => {
    const position: [number, number, number] = [
        width/2+.1,
        length/2+.1,
        0
    ]
    const planeArgs: [number, number, number, number] = [
        width,
        length,
        Math.floor(width / 20) || 1,
        Math.floor(length / 20) || 1,
    ]
    if (!visible) return null
    return (
        <group {...otherProps} >
            {width && length && <mesh position={position}>
                <planeGeometry args={planeArgs}/>
                <meshStandardMaterial wireframe={true} opacity={.2}/>
            </mesh>}
        </group>
    )
}

export default Floor
