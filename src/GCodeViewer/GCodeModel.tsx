import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GCode, GCodeOptions, GCodeParseProgress } from "./gcode/GCode";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import GCodeLayer from "./GCodeLayer";
import { GPoint } from "./gcode/types";
import { BaseReader } from "./gcode/reader";
import { Color } from "three";

const MIN_POINTS = 20
const CAMERA_OFFSET = 100
const DEFAULT_HEIGHT = 20
const DEFAULT_CENTER = {x: 100, y: 100}
const DEFAULT_ROTATION: [number, number, number] = [-Math.PI/2, 0, 0]
const BACKGROUND = new Color("white")

export interface GCodeViewerContentProps {
    reader: BaseReader
    layerColor?: CSSProperties["color"]
    topLayerColor?: CSSProperties["color"]
    visible?: number
    quality?: number
    onProgress?: (progress: GCodeParseProgress) => any
    onFinishLoading?: (finish: GCodeParseProgress) => any
    onError?: (err: Error) => any
}

function useSortedLayers(layers: Record<number, GPoint[]>) {
    return useMemo(() =>
            Object.entries(layers)
                .filter(([,points]) => {
                    let count = 0
                    for (const point of points) {
                        if (point.type === "extrude") count++
                        if (count >= MIN_POINTS) return true
                    }
                    return false
                })
                .sort(([a], [b]) => Number(a) > Number(b) ? 1:-1)
                .map(el => el[1])
        , [layers])
}

export default function GCodeModel(
    {
        reader,
        layerColor = "grey",
        topLayerColor = "hotpink",
        visible = 1,
        quality = 1,
        onProgress,
        onFinishLoading,
        onError
    }: GCodeViewerContentProps
) {
    const {camera} = useThree()
    const gCodeRef = useRef<GCode>()
    const callbacks = useRef({onFinishLoading, onError, onProgress})
    useEffect(() => {
        callbacks.current.onFinishLoading = onFinishLoading
        callbacks.current.onError = onError
        callbacks.current.onProgress = onProgress
    }, [onFinishLoading, onError, onProgress])

    const [height, setHeight] = useState(DEFAULT_HEIGHT)
    const [center, setCenter] = useState(DEFAULT_CENTER)
    const [layers, setLayers] = useState({} as Record<number, GPoint[]>)

    const onGCodeProgress = useCallback((progress: GCodeParseProgress) => {
        setLayers({...gCodeRef.current?.layers})
        setCenter(progress.baseCenter)
        setHeight((prev) => {
            const height = progress.max.z / 2
            if (height > prev) return height
            return prev
        })
    }, [])

    useEffect(() => {
        const onProgress = callbacks.current.onProgress || (() => {})
        const onFinished = callbacks.current.onFinishLoading || (() => {})
        const onError = callbacks.current.onError || (() => {})
        const options: GCodeOptions = {
            quality,
            onProgress: (progress) => {
                onGCodeProgress(progress)
                onProgress(progress)
            },
            onFinished: (progress) => {
                onGCodeProgress(progress)
                onFinished(progress)
            }
        }
        const gCode = new GCode(options)
        gCodeRef.current = gCode
        gCode.parse(reader).catch(onError)
    }, [reader, quality, onGCodeProgress])

    const sortedLayers = useSortedLayers(layers)

    useEffect(() => {
        camera.position.set(-CAMERA_OFFSET, CAMERA_OFFSET, 0)
    }, [camera])

    const cameraPos: [number, number, number] = [-CAMERA_OFFSET, CAMERA_OFFSET*.5, CAMERA_OFFSET]
    const position: [number, number, number] = [-center.x, -center.y, -height]
    const limit = Math.ceil(Object.keys(sortedLayers).length*visible)
    const baseOpacity = .7
    const color = (index: number) => index+1 > limit-2 ? topLayerColor: layerColor
    const opacity = (index: number) => (index/limit)*(1-baseOpacity)+baseOpacity
    const lineWidth = (index: number) => index+1 > limit-2 ? 2:.1

    return (
        <>
            <PerspectiveCamera
                makeDefault
                position={cameraPos}
                near={1}
                far={1000}
                {...{} as any}
            />
            <scene background={BACKGROUND}/>
            <OrbitControls/>
            <group rotation={DEFAULT_ROTATION}>
                <group position={position}>
                    {sortedLayers
                        .slice(0, limit)
                        .map((points, i) =>
                            <GCodeLayer
                                key={`${i} ${points.length}`}
                                points={points}
                                color={color(i)}
                                opacity={opacity(i)}
                                linewidth={lineWidth(i)}
                            />
                        )
                    }
                </group>
            </group>
        </>
    )
}
