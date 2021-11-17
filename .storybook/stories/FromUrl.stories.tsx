import { FC } from "react";
import { GCodeViewer, GCodeViewerProps } from "../../src";
import { ComponentMeta } from "@storybook/react";
import React from "react";

const url = "https://storage.googleapis.com/ucloud-v3/61575ddb9d8a176950431398.gcode"

function FromUrl(props: Omit<GCodeViewerProps, "url">) {
    return (
        <GCodeViewer
            url={url}
            showAxes
            orbitControls
            style={{
                position: "absolute",
                top: '0vh',
                left: '0vw',
                width: '100vw',
                height: '100vh',
                backgroundColor: "white"
            }}
            floorProps={{
                gridWidth: 300,
                gridLength: 300
            }}
            {...props}
            layerColor={"#008675"}
            topLayerColor={"#e79f0d"}
            onProgress={console.log}
            onFinishLoading={console.log}
        />
    );
}

export const Primary = FromUrl.bind({})

export default {
    component: GCodeViewer,
    title: "GCodeViewer from url",
} as ComponentMeta<FC<GCodeViewerProps>>
