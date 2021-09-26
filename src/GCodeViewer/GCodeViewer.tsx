import React, { HTMLProps, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import GCodeModel, { GCodeViewerContentProps } from "./GCodeModel";
import { BaseReader, StringReader, StringReaderOptions, UrlReader, UrlReaderOptions } from "./gcode/reader";


export interface GCodeViewerProps extends
    Omit<HTMLProps<HTMLDivElement>, "onError" | "onProgress">,
    Omit<GCodeViewerContentProps, "reader">
{
    url?: UrlReaderOptions["url"]
    file?: StringReaderOptions["file"]
    reqOptions?: RequestInit
    canvasId?: string
}

export function GCodeViewer(
    {
        canvasId,
        children,
        url,
        file,
        layerColor,
        topLayerColor,
        visible,
        quality,
        reqOptions,
        onProgress,
        onFinishLoading,
        onError,
        ...otherProps
    }: GCodeViewerProps
) {
    const reader: BaseReader = useMemo(() => {
        if (url) {
            return new UrlReader({url, reqOptions})
        } else if (file) {
            return new StringReader({file})
        } else {
            throw new Error("invalid reader options")
        }
    }, [url, file])
    const modelProps: GCodeViewerContentProps = {
        reader,
        visible,
        layerColor,
        topLayerColor,
        quality,
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
