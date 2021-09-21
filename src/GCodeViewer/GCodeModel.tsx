import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GCode } from "./gcode/GCode";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import GCodeLayer from "./GCodeLayer";
import { GPoint } from "./gcode/types";
import { BaseReader } from "./gcode/reader";

const MIN_POINTS = 20
const CAMERA_OFFSET = 100
const DEFAULT_HEIGHT = 20
const DEFAULT_ROTATION= [-90, 10, -45]

export interface GCodeViewerContentProps {
    reader: BaseReader
    layerColor?: CSSProperties["color"]
    topLayerColor?: CSSProperties["color"]
    visible?: number
    quality?: number
    onFinishLoading?: () => any
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
        onFinishLoading,
        onError
    }: GCodeViewerContentProps
) {
    const {camera} = useThree()

    const callbacks = useRef({onFinishLoading, onError})
    useEffect(() => {
        callbacks.current.onFinishLoading = onFinishLoading
        callbacks.current.onError = onError
    }, [onFinishLoading, onError])

    const [height, setHeight] = useState(DEFAULT_HEIGHT)
    const [center, setCenter] = useState(null as null | { x: number, y: number })
    const [layers, setLayers] = useState({} as Record<number, GPoint[]>)

    const onGCodeProgress = useCallback((gCode: GCode) => {
        setLayers(prev => {
            const l: Record<number, GPoint[]> = {}
            Object.entries(gCode.layers).forEach(([zString, points]) => {
                const z = Number(zString)
                if (prev[z]?.length === points.length) {
                    l[z] = prev[z]
                } else {
                    l[z] = points
                }
            })
            return l
        })
        setCenter(prev => {
            if (prev) return prev
            return gCode.baseCenter || prev
        })
        setHeight((prev) => {
            const height = gCode.limits.max.z / 2
            if (height > prev) return height
            return prev
        })
    }, [])

    useEffect(() => {
        const gCode = new GCode({quality})
        gCode.parse(reader, () => onGCodeProgress(gCode))
            .then(() => callbacks.current.onFinishLoading && callbacks.current.onFinishLoading())
            .catch((err) => callbacks.current.onError && callbacks.current.onError(err))
    }, [reader, quality, onGCodeProgress])

    const sortedLayers = useSortedLayers(layers)

    useEffect(() => {
        camera.position.set(-CAMERA_OFFSET,CAMERA_OFFSET , 0)
    }, [camera])

    const position: [number, number, number] = center ? [-center.x, -center.y, -height]:[0, 0, 0]
    const rotation = DEFAULT_ROTATION.map(n => n*Math.PI/180) as [number, number, number]
    const limit = Math.ceil(Object.keys(sortedLayers).length*visible)
    const baseOpacity = .7
    const color = (index: number) => index+1 > limit-2 ? topLayerColor: layerColor
    const opacity = (index: number) => (index/limit)*(1-baseOpacity)+baseOpacity
    const lineWidth = (index: number) => index+1 > limit-2 ? 2:.1

    return (
        <>
            <OrbitControls {...{} as any}/>
            <group rotation={rotation}>
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
