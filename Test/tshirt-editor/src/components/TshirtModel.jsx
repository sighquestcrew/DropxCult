"use client";
import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { TextureLoader } from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils";

export default function TshirtModel({ texture, color = "white", modelPath = "/models/Animated Walking Tshirt.glb", scale = [10, 10, 10], position = [0, 3, 0], normalMapPath = null }) {
    const group = useRef();
    const { scene } = useGLTF(modelPath);
    const [normalMap, setNormalMap] = useState(null);

    const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

    // Load normal map if path is provided
    useEffect(() => {
        if (normalMapPath) {
            const loader = new TextureLoader();
            loader.load(normalMapPath, (loadedTexture) => {
                setNormalMap(loadedTexture);
            });
        } else {
            setNormalMap(null);
        }
    }, [normalMapPath]);

    useEffect(() => {
        clonedScene.traverse((child) => {
            if (child.isMesh) {
                // Clear any default texture from the GLB
                child.material.map = null;

                // Apply normal map for fabric texture (only if provided)
                if (normalMap) {
                    child.material.normalMap = normalMap;
                    child.material.normalScale.set(0.5, 0.5);
                } else {
                    // Remove cloth/knit texture maps for other models
                    child.material.normalMap = null;
                }
                child.material.bumpMap = null;
                child.material.roughnessMap = null;
                child.material.aoMap = null;

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
    }, [clonedScene, texture, color, normalMap]);

    // useFrame(() => {
    //     group.current.rotation.y += 0.002;
    // });

    return <primitive ref={group} object={clonedScene} scale={scale} position={position} />;
}
