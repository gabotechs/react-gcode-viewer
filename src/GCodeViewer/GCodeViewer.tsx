import React, { HTMLProps, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import GCodeModel, { GCodeViewerContentProps } from "./GCodeModel";
import { BaseReader, UrlReader, UrlReaderOptions } from "./gcode/reader";


export interface GCodeViewerProps extends
    Omit<HTMLProps<HTMLDivElement>, "onError" | "onProgress">,
    Omit<GCodeViewerContentProps, "reader">
{
    url: UrlReaderOptions["url"]
    reqOptions?: RequestInit
    canvasId?: string
}

export function GCodeViewer(
    {
        canvasId,
        children,
        url,
        showAxes,
        orbitControls,
        layerColor,
        topLayerColor,
        visible,
        quality,
        floorProps,
        reqOptions,
        onProgress,
        onFinishLoading,
        onError,
        ...otherProps
    }: GCodeViewerProps
) {
    const reader: BaseReader = useMemo(() => {
        return new UrlReader({url, reqOptions})
    }, [url])
    const modelProps: GCodeViewerContentProps = {
        reader,
        visible,
        layerColor,
        topLayerColor,
        quality,
        showAxes,
        orbitControls,
        floorProps,
        onProgress,
        onFinishLoading,
        onError
    }
    return (
        <div {...otherProps}>
            <React.Suspense fallback={null}>
                <Canvas
                    id={canvasId}
                    style={{width: '100%', height: '100%'}}
                    gl={{preserveDrawingBuffer: true}}
                >
                    <GCodeModel {...modelProps}/>
                </Canvas>
            </React.Suspense>
            {children}
        </div>
    )
}
