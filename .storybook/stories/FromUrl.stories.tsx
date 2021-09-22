import { FC } from "react";
import { GCodeViewer, GCodeViewerProps } from "../../src";
import { ComponentMeta } from "@storybook/react";
import React from "react";

const url = "https://storage.googleapis.com/ucloud-v3/6127a7f9aa32f718b8c1ab4f.gcode"

function FromUrl(props: Omit<GCodeViewerProps, "url">) {
    return (
        <GCodeViewer
            url={url}
            style={{
                position: "absolute",
                top: '0vh',
                left: '0vw',
                width: '100vw',
                height: '100vh',
                backgroundColor: "white"
            }}
            {...props}
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
