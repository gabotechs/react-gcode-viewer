import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GCode, GCodeOptions, GCodeParseProgress } from "./gcode/GCode";
import { OrbitControls } from "@react-three/drei";
import GCodeLayer from "./GCodeLayer";
import { GPoint } from "./gcode/types";
import { BaseReader } from "./gcode/reader";
import { Color } from "three";
import Camera from "./SceneElements/Camera";
import Floor from "./SceneElements/Floor";
import { useThree } from "@react-three/fiber";

const MIN_POINTS = 2
const CAMERA_OFFSET = 120
const DEFAULT_HEIGHT = 20
const DEFAULT_CENTER = {x: 100, y: 100}
const BACKGROUND = new Color("white")

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
    useEffect(() => {
        camera.position.set(.7*CAMERA_OFFSET, -CAMERA_OFFSET, CAMERA_OFFSET)
    }, [camera])
    const [sceneReady, setSceneReady] = useState(false)

    const gCodeRef = useRef<GCode>()
    const callbacks = useRef({onFinishLoading, onError, onProgress})
    useEffect(() => {
        callbacks.current.onFinishLoading = onFinishLoading
        callbacks.current.onError = onError
        callbacks.current.onProgress = onProgress
    }, [onFinishLoading, onError, onProgress])

    const [center, setCenter] = useState(DEFAULT_CENTER)
    const [layers, setLayers] = useState({} as Record<number, GPoint[]>)

    useEffect(() => {
        const lookAt: [number, number, number] = [center.x || gridWidth/2, center.y || gridLength/2, DEFAULT_HEIGHT]
        camera.lookAt(...lookAt)
    }, [center.x, center.y])

    const onGCodeProgress = useCallback((progress: GCodeParseProgress) => {
        setLayers({...gCodeRef.current?.layers})
        setCenter(progress.baseCenter)
        setSceneReady(true)
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

    const target: [number, number, number] = [center.x || gridWidth/2, center.y || gridLength/2, DEFAULT_HEIGHT]
    const limit = Math.ceil(Object.keys(sortedLayers).length*visible)
    const baseOpacity = .7
    const color = (index: number) => index+1 > limit-2 ? topLayerColor: layerColor
    const opacity = (index: number) => (index/limit)*(1-baseOpacity)+baseOpacity
    const lineWidth = (index: number) => index+1 > limit-2 ? 2:.1

    return (
        <>
            <Camera/>
            {sceneReady && showAxes && <axesHelper args={[50]}/>}
            <Floor
                visible={sceneReady}
                length={gridLength}
                width={gridWidth}
            />
            <scene background={BACKGROUND}/>
            {sceneReady && orbitControls && <OrbitControls target={target}/>}
            <group>
                {sortedLayers
                    .slice(0, limit)
                    .map((points, i) =>
                        <GCodeLayer
                            key={`${i} ${points.length}`}
                            points={points}
                            color={color(i)}
                            opacity={sceneReady ? opacity(i):0}
                            linewidth={lineWidth(i)}
                        />
                    )
                }
            </group>
        </>
    )
}
