"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CanvasTexture } from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Center, Environment } from "@react-three/drei";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import TshirtModel from "@/components/TshirtModel";
import FabricCanvas from "@/components/FabricCanvas";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setTshirtType, setTshirtColor } from "@/redux/slices/editorSlice";

export default function Home() {
    const dispatch = useAppDispatch();
    const { tshirtType, tshirtColor } = useAppSelector((state) => state.editor);
    const searchParams = useSearchParams();
    const isViewOnly = searchParams.get('viewOnly') === 'true';

    const [texture, setTexture] = useState<CanvasTexture | null>(null);
    const [offsetY, setOffsetY] = useState(-0.01);
    const [offsetX, setOffsetX] = useState(-0.01);
    const [cameraDistance, setCameraDistance] = useState(50);
    const [showControls, setShowControls] = useState(false);
    const [isEditorVisible, setIsEditorVisible] = useState(true);

    // Asset paths based on type
    const assets = {
        regular: {
            model: "/models/Animated Walking Tshirt.glb",
            template: "/designs/Template.png"
        },
        oversized: {
            model: "/models/Over_Size_Tshirt.glb",
            template: "/designs/Over_Size_Tshirt_Template.png"
        }
    };

    useEffect(() => {
        if (texture) {
            texture.offset.y = offsetY;
            texture.offset.x = offsetX;
            texture.needsUpdate = true;
        }
    }, [texture, offsetY, offsetX]);

    // Adjust camera distance when view changes
    useEffect(() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

        if (isViewOnly) {
            // ViewOnly mode: far on mobile, normal on PC
            setCameraDistance(isMobile ? 120 : 50);
        } else if (!isEditorVisible) {
            setCameraDistance(90); // Move back more when full screen
        } else {
            setCameraDistance(50); // Default distance
        }
    }, [isEditorVisible, isViewOnly]);

    useEffect(() => {
        return () => {
            if (texture) texture.dispose();
        };
    }, [texture]);

    const handleUpdate = (canvas: HTMLCanvasElement) => {
        const offscreen = document.createElement("canvas");
        offscreen.width = canvas.width;
        offscreen.height = canvas.height;
        const ctx = offscreen.getContext("2d");
        if (ctx) {
            // FabricCanvas now handles the background color composition
            ctx.drawImage(canvas, 0, 0);

            if (texture) {
                texture.image = offscreen;
                texture.needsUpdate = true;
            } else {
                const tex = new CanvasTexture(offscreen);
                tex.flipY = false;
                tex.colorSpace = "srgb";
                tex.offset.y = offsetY;
                tex.offset.x = offsetX;
                setTexture(tex);
            }
        }
    };

    const handleProjectLoad = (data: any) => {
        if (data.type) {
            dispatch(setTshirtType(data.type));
        }
        if (data.color) {
            dispatch(setTshirtColor(data.color));
        }
    };

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const get3DSnapshot = () => {
        if (canvasRef.current) {
            return canvasRef.current.toDataURL('image/png', 0.8);
        }
        return null;
    };

    return (
        <div className="flex flex-col lg:flex-row w-full min-h-screen lg:h-screen">
            {/* Editor Section - Visually hidden in viewOnly mode but still renders to generate texture */}
            <div className={`${isViewOnly ? 'absolute -left-[9999px] opacity-0 pointer-events-none' : (isEditorVisible ? 'flex' : 'hidden')} lg:flex w-full lg:w-1/2 items-center justify-center bg-[#1a1a1a] p-4 lg:overflow-y-auto shrink-0 transition-all duration-300`}>
                <ErrorBoundary>
                    <FabricCanvas
                        onUpdate={handleUpdate}
                        tshirtColor={tshirtColor}
                        backgroundImage={assets[tshirtType as keyof typeof assets].template}
                        tshirtType={tshirtType}
                        onLoad={handleProjectLoad}
                        onGetSnapshot={get3DSnapshot}
                    />
                </ErrorBoundary>
            </div>

            {/* 3D Preview Section - Full screen in viewOnly mode */}
            <div
                className={`w-full ${isViewOnly ? 'h-screen' : (isEditorVisible ? 'h-[50vh]' : 'h-screen')} lg:h-full ${isViewOnly ? 'lg:w-full' : 'lg:w-1/2'} relative shrink-0 transition-all duration-300 ${isViewOnly ? '' : 'pb-20 lg:pb-24'}`}
                style={{ touchAction: 'pan-y pinch-zoom' }}
            >
                {/* Mobile View Toggle Button - Hidden in viewOnly mode */}
                {!isViewOnly && (
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => setIsEditorVisible(!isEditorVisible)}
                        className="absolute top-2 right-2 z-20 h-10 w-10 lg:hidden shadow-lg bg-white/90 backdrop-blur-sm text-black hover:bg-white"
                    >
                        {isEditorVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                )}

                {/* Texture Controls - Hidden in viewOnly mode */}
                {!isViewOnly && (showControls ? (
                    <Card className="absolute top-2 left-2 lg:top-4 lg:left-4 z-10 w-56 lg:w-64">
                        <div className="p-3 lg:p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold">Texture Controls</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowControls(false)}
                                    className="h-6 w-6 p-0"
                                >
                                    <ChevronUp className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-3 lg:space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs lg:text-sm font-medium">Fit Type</label>
                                    <select
                                        className="w-full h-8 rounded border bg-background text-sm px-2"
                                        value={tshirtType}
                                        onChange={(e) => dispatch(setTshirtType(e.target.value as 'regular' | 'oversized'))}
                                    >
                                        <option value="regular">Regular Fit</option>
                                        <option value="oversized">Oversized Fit</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs lg:text-sm font-medium">
                                        Offset Y: {offsetY.toFixed(2)}
                                    </label>
                                    <Slider
                                        min={-2}
                                        max={2}
                                        step={0.01}
                                        value={[offsetY]}
                                        onValueChange={(value) => setOffsetY(value[0])}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs lg:text-sm font-medium">
                                        Offset X: {offsetX.toFixed(2)}
                                    </label>
                                    <Slider
                                        min={-2}
                                        max={2}
                                        step={0.01}
                                        value={[offsetX]}
                                        onValueChange={(value) => setOffsetX(value[0])}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs lg:text-sm font-medium">
                                        T-Shirt Color
                                    </label>
                                    <input
                                        type="color"
                                        value={tshirtColor}
                                        onChange={(e) => dispatch(setTshirtColor(e.target.value))}
                                        className="w-full h-10 rounded border cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => setShowControls(true)}
                        className="absolute top-2 left-2 lg:top-4 lg:left-4 z-10 h-10 w-10"
                    >
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                ))}
                <Canvas
                    ref={canvasRef}
                    gl={{ preserveDrawingBuffer: true }}
                    camera={{ position: [0, 0, cameraDistance], fov: 50 }}
                    key={cameraDistance}
                >
                    <color attach="background" args={["#1a1a1a"]} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                    <Environment preset="city" />
                    <OrbitControls
                        enableZoom={true}
                        enablePan={true}
                        minDistance={10}
                        maxDistance={200}
                    />
                    <Center>
                        <TshirtModel
                            texture={texture}
                            color={tshirtColor}
                            modelPath={assets[tshirtType as keyof typeof assets].model}
                        />
                    </Center>
                </Canvas>
            </div>
        </div>
    );
}
