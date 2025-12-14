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

export default function TwoDShirt({
  design,
  elements,
  view, // "front" | "back" | "left" | "right"
  setView,
  onSelect,
  selectedId
}: any) {
  // 1. Get elements for the current view
  const currentElements = elements?.[view] || [];

  // 2. Resolve Base Image (Fallback to T-Shirt Front if missing)
  const baseImage =
    TEMPLATES[design.type]?.[view] || TEMPLATES["T-Shirt"].front;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden relative p-4">
      {/* --- CANVAS AREA --- */}
      <div className="relative w-full max-w-[400px] aspect-[3/4]">
        {/* BASE PRODUCT IMAGE */}
        <img
          src={baseImage}
          alt="Product Base"
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

        {/* PRINT AREA (z-index 10 ensures it's above the base image) */}
        <div className="absolute inset-0 z-10 overflow-hidden">

          {currentElements.map((el: any) => (
            <div
              key={el.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(el.id);
              }}
              className={`absolute cursor-pointer hover:ring-1 hover:ring-white/50 ${selectedId === el.id ? 'ring-2 ring-red-600' : ''}`}
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
                  className="max-w-[200px] max-h-[200px] object-contain"
                  style={{ pointerEvents: 'none' }}
                />
              ) : (
                <div
                  className="whitespace-nowrap font-bold"
                  style={{
                    fontSize: `${(el.fontSize || 1) * 2}rem`,
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

      {/* --- VIEW SWITCHER --- */}
      <div className="absolute bottom-4 flex gap-2 bg-black/80 p-2 rounded-full backdrop-blur-md z-20">
        {["front", "back", "left", "right"].map((side) => (
          <button
            key={side}
            onClick={() => setView(side)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition ${view === side
                ? "bg-white text-black"
                : "bg-transparent text-gray-400 hover:text-white"
              }`}
          >
            {side}
          </button>
        ))}
      </div>
    </div>
  );
}