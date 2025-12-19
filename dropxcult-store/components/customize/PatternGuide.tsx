"use client";

import React from "react";
import { Shirt, RotateCcw, Hand, Sparkles } from "lucide-react";

// MAPPING: Define which base image to show based on Type + View
const TEMPLATES: any = {
    "T-Shirt": {
        front: "/templates/tshirt-front.png",
        back: "/templates/tshirt-back.png",
        left: "/templates/tshirt-left.png",
        right: "/templates/tshirt-right.png",
    },
    "Hoodie": {
        front: "/templates/hoodie-front.png",
        back: "/templates/hoodie-back.png",
        left: "/templates/hoodie-left.png",
        right: "/templates/hoodie-right.png",
    },
};

// View icons mapping
const VIEW_ICONS: { [key: string]: React.ReactNode } = {
    front: <Shirt size={16} />,
    back: <RotateCcw size={16} />,
    left: <Hand size={16} style={{ transform: 'scaleX(-1)' }} />,
    right: <Hand size={16} />,
};

interface PatternGuideProps {
    design: any;
    elements: any;
    onSelect: (id: string) => void;
    selectedId: string | null;
    currentView: "front" | "back" | "left" | "right";
    setCurrentView: (view: "front" | "back" | "left" | "right") => void;
}

export default function PatternGuide({
    design,
    elements,
    onSelect,
    selectedId,
    currentView,
    setCurrentView
}: PatternGuideProps) {

    const views = [
        { id: "front" as const, label: "Front" },
        { id: "back" as const, label: "Back" },
        { id: "left" as const, label: "Left Sleeve" },
        { id: "right" as const, label: "Right Sleeve" }
    ];

    // Count elements per view
    const getElementCount = (view: string) => elements?.[view]?.length || 0;

    const renderFocusedView = (view: "front" | "back" | "left" | "right") => {
        const currentElements = elements?.[view] || [];
        const baseImage = TEMPLATES[design.type]?.[view] || TEMPLATES["T-Shirt"].front;
        const visibleElements = currentElements.filter((el: any) => el.visible !== false);

        return (
            <div className="flex items-center justify-center h-full w-full p-4 sm:p-8">
                {/* Canvas Container with Premium Styling */}
                <div className="relative w-full max-w-[550px]">
                    {/* Glow effect behind the canvas */}
                    <div
                        className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl"
                        style={{
                            background: `radial-gradient(circle at center, ${design.color}40 0%, transparent 70%)`
                        }}
                    />

                    {/* Main Canvas */}
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 shadow-2xl shadow-black/50 border border-zinc-700/50">
                        {/* Subtle Grid Pattern */}
                        <div
                            className="absolute inset-0 opacity-[0.02]"
                            style={{
                                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                                backgroundSize: '20px 20px'
                            }}
                        />

                        {/* BASE PRODUCT IMAGE */}
                        <img
                            src={baseImage}
                            alt={`${view} Base`}
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
                            style={{ filter: `drop-shadow(0 0 0 ${design.color})` }}
                        />

                        {/* Color overlay using mask */}
                        <div
                            className="absolute inset-0 w-full h-full mix-blend-multiply pointer-events-none z-1"
                            style={{
                                backgroundColor: design.color,
                                maskImage: `url(${baseImage})`,
                                WebkitMaskImage: `url(${baseImage})`,
                                maskSize: "contain",
                                WebkitMaskSize: "contain",
                                maskRepeat: "no-repeat",
                                WebkitMaskRepeat: "no-repeat",
                                maskPosition: "center",
                                WebkitMaskPosition: "center",
                            }}
                        />

                        {/* PRINT AREA */}
                        <div className="absolute inset-0 z-10 overflow-hidden">
                            {visibleElements.map((el: any) => (
                                <div
                                    key={el.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(el.id);
                                    }}
                                    className={`absolute cursor-pointer transition-all duration-200 ${selectedId === el.id
                                            ? 'ring-4 ring-purple-500 ring-offset-2 ring-offset-transparent shadow-lg shadow-purple-500/30'
                                            : 'hover:ring-2 hover:ring-white/50'
                                        }`}
                                    style={{
                                        top: `${50 + el.y * 50}%`,
                                        left: `${50 + el.x * 50}%`,
                                        transform: `translate(-50%, -50%) scale(${el.scale}) rotate(${el.rotation}deg)`,
                                        zIndex: 10
                                    }}
                                >
                                    {el.type === 'image' ? (
                                        <img
                                            src={el.url}
                                            alt="Design Element"
                                            className="max-w-[150px] max-h-[150px] object-contain rounded"
                                            style={{ pointerEvents: 'none' }}
                                        />
                                    ) : (
                                        <div
                                            className="whitespace-nowrap font-bold select-none"
                                            style={{
                                                fontSize: `${(el.fontSize || 1) * 1.5}rem`,
                                                color: el.color || "#000000",
                                                fontFamily: el.font || "Arial, sans-serif",
                                                WebkitTextStroke: `${el.thickness || 0}px ${el.color || "#000000"}`,
                                                pointerEvents: 'none',
                                                textShadow: selectedId === el.id ? '0 0 10px rgba(168, 85, 247, 0.5)' : 'none'
                                            }}
                                        >
                                            {el.content}
                                        </div>
                                    )}

                                    {/* Selection Indicator */}
                                    {selectedId === el.id && (
                                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                                            <Sparkles size={10} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Empty State Hint */}
                        {visibleElements.length === 0 && (
                            <div className="absolute inset-0 z-5 flex items-center justify-center pointer-events-none">
                                <div className="text-center text-gray-500 opacity-50">
                                    <div className="w-16 h-16 mx-auto mb-2 rounded-2xl border-2 border-dashed border-gray-600 flex items-center justify-center">
                                        <Sparkles size={24} className="text-gray-600" />
                                    </div>
                                    <p className="text-xs font-medium">Add text or images</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* View Label Badge */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-xs font-semibold text-gray-300 shadow-lg">
                        {view.charAt(0).toUpperCase() + view.slice(1)} View
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            {/* VIEW TABS - Enhanced Design */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-4 sm:p-6 bg-zinc-900/30 border-b border-zinc-800/50 backdrop-blur-sm">
                {views.map((view) => {
                    const count = getElementCount(view.id);
                    const isActive = currentView === view.id;

                    return (
                        <button
                            key={view.id}
                            onClick={() => setCurrentView(view.id)}
                            className={`
                                relative flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider
                                transition-all duration-300 ease-out
                                ${isActive
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                                    : 'bg-zinc-800/60 text-gray-400 hover:bg-zinc-700/80 hover:text-gray-200 border border-zinc-700/50 hover:border-zinc-600'
                                }
                            `}
                        >
                            {/* View Icon */}
                            <span className={isActive ? 'text-white' : 'text-gray-500'}>
                                {VIEW_ICONS[view.id]}
                            </span>

                            {/* Label */}
                            <span className="hidden sm:inline">{view.label}</span>
                            <span className="sm:hidden">{view.label.split(' ')[0]}</span>

                            {/* Element Count Badge */}
                            {count > 0 && (
                                <span className={`
                                    absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center 
                                    rounded-full text-[10px] font-bold px-1.5 shadow-md
                                    ${isActive
                                        ? 'bg-white text-purple-600'
                                        : 'bg-purple-500 text-white'
                                    }
                                `}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* FOCUSED VIEW */}
            <div className="flex-1 overflow-hidden">
                {renderFocusedView(currentView)}
            </div>
        </div>
    );
}

