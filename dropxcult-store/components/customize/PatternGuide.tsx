"use client";

import React from "react";

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

    const renderFocusedView = (view: "front" | "back" | "left" | "right") => {
        const currentElements = elements?.[view] || [];
        const baseImage = TEMPLATES[design.type]?.[view] || TEMPLATES["T-Shirt"].front;

        return (
            <div className="flex items-center justify-center h-full w-full p-8">
                <div className="relative w-full max-w-[600px] aspect-[3/4] border-2 rounded-xl overflow-hidden bg-white shadow-2xl border-red-500">
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
                        {currentElements.map((el: any) => (
                            <div
                                key={el.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(el.id);
                                }}
                                className={`absolute cursor-pointer hover:ring-2 hover:ring-red-400 transition-all ${selectedId === el.id ? 'ring-4 ring-red-600' : ''}`}
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
                                        className="max-w-[150px] max-h-[150px] object-contain"
                                        style={{ pointerEvents: 'none' }}
                                    />
                                ) : (
                                    <div
                                        className="whitespace-nowrap font-bold"
                                        style={{
                                            fontSize: `${(el.fontSize || 1) * 1.5}rem`,
                                            color: el.color || "#000000",
                                            fontFamily: el.font || "Arial, sans-serif",
                                            WebkitTextStroke: `${el.thickness || 0}px ${el.color || "#000000"}`,
                                            pointerEvents: 'none'
                                        }}
                                    >
                                        {el.content}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col bg-zinc-950">
            {/* VIEW TABS - Improved Design */}
            <div className="flex flex-wrap items-center justify-center gap-3 p-6 bg-zinc-900/50 border-b border-zinc-800">
                {views.map((view) => (
                    <button
                        key={view.id}
                        onClick={() => setCurrentView(view.id)}
                        className={`
                            relative px-6 sm:px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-[0.15em] 
                            transition-all duration-300 ease-out
                            ${currentView === view.id
                                ? 'bg-gradient-to-br from-white to-gray-100 text-black shadow-2xl shadow-white/20 scale-105'
                                : 'bg-zinc-800/50 text-gray-500 hover:bg-zinc-700/70 hover:text-gray-300 hover:scale-102 border border-zinc-700/50'
                            }
                        `}
                    >
                        <span className="relative z-10">{view.label}</span>
                        {currentView === view.id && (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
                        )}
                    </button>
                ))}
            </div>

            {/* FOCUSED VIEW */}
            <div className="flex-1 overflow-hidden">
                {renderFocusedView(currentView)}
            </div>
        </div>
    );
}
