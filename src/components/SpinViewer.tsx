import React, { useMemo, useState } from "react";
import { Image, PanResponder, Text, View } from "react-native";

type Props = {
    frameUrls: string[]; // can be gs:// if you convert to https; for demo use https download URLs
    width?: number;
    height?: number;
};

export function SpinViewer({ frameUrls, width = 360, height = 240 }: Props) {
    const [idx, setIdx] = useState(0);
    const n = frameUrls?.length || 0;

    const pan = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, g) => {
            if (!n) return;
            const delta = Math.floor(g.dx / 18);
            const next = (idx - delta) % n;
            setIdx((next + n) % n);
        }
    }), [idx, n]);

    if (!n) {
        return (
            <View style={{ width, height, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 12 }}>
                <Text>No frames</Text>
            </View>
        );
    }

    return (
        <View {...pan.panHandlers} style={{ width, height, borderWidth: 1, borderRadius: 12, overflow: "hidden" }}>
            <Image
                source={{ uri: frameUrls[idx] }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
            />
        </View>
    );
}
