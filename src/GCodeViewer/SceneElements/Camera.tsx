import React, { useEffect } from "react"
import { PerspectiveCamera } from "@react-three/drei";
import { PerspectiveCameraProps, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

export interface CameraProps extends Partial<PerspectiveCameraProps> {
    initialPosition?: { x: number, y: number, z: number}
}

const Camera: React.FC<CameraProps> = (
    {
        initialPosition,
        ...otherProps
    }
) => {
    const {camera} = useThree()
    useEffect(() => {
        camera.up.applyAxisAngle(new Vector3(1, 0, 0), Math.PI/2)
        if (initialPosition !== undefined) {
            camera.position.set(initialPosition.x, initialPosition.y, initialPosition.z)
        }
    }, [camera])

    return (
        <PerspectiveCamera
            makeDefault
            near={1}
            far={1000}
            {...otherProps}
        />
    )
}

export default Camera
