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
    const [modelScale, setModelScale] = useState(10);

    // Asset paths based on type
    const assets = {
        regular: {
            model: "/models/Animated Walking Tshirt.glb",
            template: "/designs/Template.png",
            scale: [10, 10, 10],
            position: [0, 3, 0],
            offsetX: -0.01,
            offsetY: -0.01,
            normalMap: "/Texture/Oversized-Tshirt_normal_1001.png"
        },
        oversized: {
            model: "/models/Over_Size_Tshirt.glb",
            template: "/designs/Over_Size_Tshirt_Template.png",
            scale: [50, 50, 50],
            position: [0, -5, 0],
            offsetX: -0.01,
            offsetY: -0.01,
            normalMap: "/Texture/Oversized-Tshirt_normal_1001.png"
        },
        hoodie: {
            model: "/models/Hoodie Mockup.glb",
            template: "/designs/Hooodie_Templete.png",
            scale: [48, 48, 48],
            position: [0, -5, 0],
            offsetX: 0,
            offsetY: 0,
            normalMap: "/Texture/Oversized-Tshirt_normal_1001.png"
        },
        sweatshirt: {
            model: "/models/Sweatshirt.glb",
            template: "/designs/Sweatshirt.png",
            scale: [55, 55, 55],
            position: [0, -5, 0],
            offsetX: 0,
            offsetY: 0,
            normalMap: "/Texture/Oversized-Tshirt_normal_1001.png"
        }
    };

    useEffect(() => {
        if (texture) {
            texture.offset.y = offsetY;
            texture.offset.x = offsetX;
            texture.needsUpdate = true;
        }
    }, [texture, offsetY, offsetX]);

    // Update model scale and offsets when type changes
    useEffect(() => {
        const currentAsset = assets[tshirtType as keyof typeof assets];
        setModelScale(currentAsset.scale[0]);
        setOffsetX(currentAsset.offsetX);
        setOffsetY(currentAsset.offsetY);
    }, [tshirtType]);

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
                className={`w-full ${isViewOnly ? 'h-screen' : (isEditorVisible ? 'h-[50vh]' : 'h-screen')} lg:h-full ${isViewOnly ? 'lg:w-full' : 'lg:w-1/2'} relative shrink-0 transition-all duration-300 bg-[#1a1a1a] ${isViewOnly ? '' : 'pb-20 lg:pb-24'}`}
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
                    <div className="absolute top-2 left-2 lg:top-4 lg:left-4 z-10 w-60 lg:w-72">
                        <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse"></span>
                                    Model Settings
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowControls(false)}
                                    className="h-7 w-7 p-0 hover:bg-white/10 rounded-lg text-white/70 hover:text-white"
                                >
                                    <ChevronUp className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Fit Type Selector */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Product Type</label>
                                    <select
                                        className="w-full h-10 rounded-xl border border-white/10 bg-white/5 text-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all cursor-pointer appearance-none"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
                                        value={tshirtType}
                                        onChange={(e) => dispatch(setTshirtType(e.target.value as 'regular' | 'oversized' | 'hoodie' | 'sweatshirt'))}
                                    >
                                        <option value="oversized" className="bg-zinc-900">Oversized T-Shirt</option>
                                        <option value="hoodie" className="bg-zinc-900">Hoodie</option>
                                    </select>
                                </div>

                                {/* Color Picker - Predefined colors based on product type */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Product Color</label>
                                    <div className="grid grid-cols-6 gap-2">
                                        {(tshirtType === 'hoodie' ? [
                                            { name: 'White', hex: '#FFFFFF' },
                                            { name: 'Navy', hex: '#000080' },
                                            { name: 'Army Green', hex: '#4B5320' },
                                            { name: 'Off-white', hex: '#FAF9F6' },
                                            { name: 'Maroon', hex: '#800000' },
                                            { name: 'Grey', hex: '#808080' },
                                            { name: 'Red', hex: '#FF0000' },
                                        ] : [
                                            // Oversized T-shirt colors
                                            { name: 'Black', hex: '#000000' },
                                            { name: 'White', hex: '#FFFFFF' },
                                            { name: 'Red', hex: '#FF0000' },
                                            { name: 'Maroon', hex: '#800000' },
                                            { name: 'Off-white', hex: '#FAF9F6' },
                                            { name: 'Beige', hex: '#F5F5DC' },
                                            { name: 'Lavender', hex: '#E6E6FA' },
                                            { name: 'Brown', hex: '#8B4513' },
                                            { name: 'Rose', hex: '#FF007F' },
                                            { name: 'Pink', hex: '#FFC0CB' },
                                            { name: 'Charcoal', hex: '#36454F' },
                                            { name: 'Army Green', hex: '#4B5320' },
                                            { name: 'Powder Blue', hex: '#B0E0E6' },
                                        ]).map((color) => (
                                            <button
                                                key={color.hex}
                                                title={color.name}
                                                onClick={() => dispatch(setTshirtColor(color.hex))}
                                                className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${tshirtColor.toUpperCase() === color.hex.toUpperCase()
                                                    ? 'border-purple-500 ring-2 ring-purple-500/50 scale-110'
                                                    : 'border-white/20 hover:border-white/40'
                                                    }`}
                                                style={{ backgroundColor: color.hex }}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-white/40 mt-1">Selected: {
                                        (tshirtType === 'hoodie' ? [
                                            { name: 'White', hex: '#FFFFFF' },
                                            { name: 'Navy', hex: '#000080' },
                                            { name: 'Army Green', hex: '#4B5320' },
                                            { name: 'Off-white', hex: '#FAF9F6' },
                                            { name: 'Maroon', hex: '#800000' },
                                            { name: 'Grey', hex: '#808080' },
                                            { name: 'Red', hex: '#FF0000' },
                                        ] : [
                                            { name: 'Black', hex: '#000000' },
                                            { name: 'White', hex: '#FFFFFF' },
                                            { name: 'Red', hex: '#FF0000' },
                                            { name: 'Maroon', hex: '#800000' },
                                            { name: 'Off-white', hex: '#FAF9F6' },
                                            { name: 'Beige', hex: '#F5F5DC' },
                                            { name: 'Lavender', hex: '#E6E6FA' },
                                            { name: 'Brown', hex: '#8B4513' },
                                            { name: 'Rose', hex: '#FF007F' },
                                            { name: 'Pink', hex: '#FFC0CB' },
                                            { name: 'Charcoal', hex: '#36454F' },
                                            { name: 'Army Green', hex: '#4B5320' },
                                            { name: 'Powder Blue', hex: '#B0E0E6' },
                                        ]).find(c => c.hex.toUpperCase() === tshirtColor.toUpperCase())?.name || tshirtColor
                                    }</p>
                                </div>

                                {/* Model Scale */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Scale</label>
                                        <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">{modelScale}</span>
                                    </div>
                                    <Slider
                                        min={5}
                                        max={100}
                                        step={1}
                                        value={[modelScale]}
                                        onValueChange={(value) => setModelScale(value[0])}
                                        className="py-2"
                                    />
                                </div>

                                {/* Advanced Settings Divider */}
                                <div className="flex items-center gap-2 pt-2">
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                    <span className="text-[10px] text-white/30 uppercase tracking-widest">Advanced</span>
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                                </div>

                                {/* Offset Y */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-white/60">Offset Y</label>
                                        <span className="text-xs font-mono text-white/40">{offsetY.toFixed(2)}</span>
                                    </div>
                                    <Slider
                                        min={-2}
                                        max={2}
                                        step={0.01}
                                        value={[offsetY]}
                                        onValueChange={(value) => setOffsetY(value[0])}
                                        className="py-1"
                                    />
                                </div>

                                {/* Offset X */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-white/60">Offset X</label>
                                        <span className="text-xs font-mono text-white/40">{offsetX.toFixed(2)}</span>
                                    </div>
                                    <Slider
                                        min={-2}
                                        max={2}
                                        step={0.01}
                                        value={[offsetX]}
                                        onValueChange={(value) => setOffsetX(value[0])}
                                        className="py-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
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
                        enableRotate={true}
                        minDistance={10}
                        maxDistance={200}
                    />
                    <Center>
                        <TshirtModel
                            texture={texture}
                            color={tshirtColor}
                            modelPath={assets[tshirtType as keyof typeof assets].model}
                            scale={[modelScale, modelScale, modelScale]}
                            position={assets[tshirtType as keyof typeof assets].position}
                            normalMapPath={(assets[tshirtType as keyof typeof assets] as any).normalMap || null}
                        />
                    </Center>
                </Canvas>
            </div>
        </div>
    );
}
