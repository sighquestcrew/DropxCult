"use client";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";

export default function TshirtModel({ texture, color = "white", modelPath = "/models/Animated Walking Tshirt.glb" }) {
    const group = useRef();
    const { scene } = useGLTF(modelPath);

    const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

    useEffect(() => {
        clonedScene.traverse((child) => {
            if (child.isMesh) {
                // Clear any default texture from the GLB
                child.material.map = null;

                if (texture) {
                    // Use standard map with white base color (since texture contains the color)
                    // This prevents the washout issue causing by additive emissive blending
                    child.material.map = texture;
                    child.material.map.flipY = false;

                    // Reset emissive
                    child.material.emissive.setHex(0x000000);
                    child.material.emissiveMap = null;

                    // Set base color to white so texture colors are accurate
                    child.material.color.set(0xffffff);
                } else {
                    // No texture, just apply the color
                    child.material.map = null;
                    child.material.emissive.setHex(0x000000); // No emissive
                    child.material.emissiveMap = null;
                    child.material.color.set(color);
                }
                child.material.side = 2; // DoubleSide
                child.material.needsUpdate = true;
            }
        });
    }, [clonedScene, texture, color]);

    // useFrame(() => {
    //     group.current.rotation.y += 0.002;
    // });

    return <primitive ref={group} object={clonedScene} scale={[10, 10, 10]} position={[0, 3, 0]} />;
}
