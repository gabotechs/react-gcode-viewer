import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import React, { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Color } from "three";
import { GCode, GCodeParseProgress } from "./gcode/GCode";
import { BaseReader } from "./gcode/reader";
import { GPoint } from "./gcode/types";
import GCodeLines from "./GCodeLines";
import Camera from "./SceneElements/Camera";
import Floor from "./SceneElements/Floor";

const CAMERA_OFFSET = 120
const DEFAULT_HEIGHT = 20
const DEFAULT_CENTER = {x: 100, y: 100}
const BACKGROUND = new Color("white")
const BASE_OPACITY = .7

export interface FloorProps {
    gridWidth?: number
    gridLength?: number
}

export interface GCodeViewerContentProps {
    reader: BaseReader
    layerColor?: CSSProperties["color"]
    topLayerColor?: CSSProperties["color"]
    floorProps?: FloorProps
    visible?: number
    showAxes?: boolean
    orbitControls?: boolean
    quality?: number
    onProgress?: (progress: GCodeParseProgress) => any
    onFinishLoading?: (finish: GCodeParseProgress) => any
    onError?: (err: Error) => any
}

interface GPointBatch {
    points: GPoint[]
    avgZ: number
}

export default function GCodeModel(
    {
        reader,
        layerColor = "grey",
        topLayerColor = "hotpink",
        visible = 1,
        quality = 1,
        showAxes,
        orbitControls,
        onProgress,
        onFinishLoading,
        floorProps: {
            gridLength = 0,
            gridWidth = 0
        } = {},
        onError
    }: GCodeViewerContentProps
) {
    const {camera} = useThree()
    const [sceneReady, setSceneReady] = useState(false)

    const gCodeRef = useRef<GCode>()
    const callbacks = useRef({onFinishLoading, onError, onProgress})
    useEffect(() => {
        callbacks.current.onFinishLoading = onFinishLoading
        callbacks.current.onError = onError
        callbacks.current.onProgress = onProgress
    }, [onFinishLoading, onError, onProgress])

    const [center, setCenter] = useState(DEFAULT_CENTER)
    const [gPointBatches, setGPointBatches] = useState<GPointBatch[]>([])

    useEffect(() => {
        camera.lookAt(center.x || gridWidth/2, center.y || gridLength/2, DEFAULT_HEIGHT)
    }, [center.x, center.y])

    useEffect(() => {
        function onGCodeProgress({ points, baseCenter }: GCodeParseProgress) {
            setGPointBatches(prev => {
                const sum = prev.reduce((acc, p) => acc+p.points.length, 0)
                const batchPoints = points.slice(sum)
                const avgZ = batchPoints.reduce((acc, p) => acc + p.z, 0) / (batchPoints.length || 1)
                return [...prev, { points: batchPoints, avgZ }]
            })
            setCenter(baseCenter)
            setSceneReady(true)
        }
        
        setGPointBatches([])
        gCodeRef.current?.abort()
        gCodeRef.current = new GCode({
            quality,
            onProgress: (progress) => {
                onGCodeProgress(progress)
                if (callbacks.current.onProgress) {
                    callbacks.current.onProgress(progress)
                }
            },
            onFinished: (progress) => {
                onGCodeProgress(progress)
                if (callbacks.current.onFinishLoading) {
                    callbacks.current.onFinishLoading(progress)
                }
            }
        })
        gCodeRef.current.parse(reader).catch((err) => {
            if (callbacks.current.onError) {
                callbacks.current.onError(err)
            }
        })
    }, [reader, quality])

    const target: [number, number, number] = [center.x || gridWidth/2, center.y || gridLength/2, DEFAULT_HEIGHT]
    const maxZ = useMemo(() => Math.max(...gPointBatches.map(({ avgZ }) => avgZ))*visible, [gPointBatches, visible])
    const color = (z: number) => Math.abs(maxZ - z) < .4 ? topLayerColor: layerColor
    const opacity = (z: number) => (z/maxZ)*(1-BASE_OPACITY)+BASE_OPACITY
    const lineWidth = (z: number) => Math.abs(maxZ - z) < .4 ? 2:.1

    return (
        <>
            <Camera
                initialPosition={{x: .7*CAMERA_OFFSET, y: -CAMERA_OFFSET, z: CAMERA_OFFSET}}
            />
            {sceneReady && showAxes && <axesHelper args={[50]}/>}
            <Floor
                visible={sceneReady}
                length={gridLength}
                width={gridWidth}
            />
            <scene background={BACKGROUND}/>
            {sceneReady && orbitControls && <OrbitControls target={target}/>}
            <group>
                {gPointBatches
                    .filter(({ avgZ }) => avgZ <= maxZ)
                    .map(({ points, avgZ }, i) =>
                        <GCodeLines
                            key={`${i} ${points.length}`}
                            points={points}
                            color={color(avgZ)}
                            opacity={sceneReady ? opacity(avgZ):0}
                            linewidth={lineWidth(avgZ)}
                        />
                    )
                }
            </group>
        </>
    )
}
