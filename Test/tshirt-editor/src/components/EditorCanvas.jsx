"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, ZoomIn, ZoomOut } from "lucide-react";

export default function EditorCanvas({ onUpdate }) {
    const canvasRef = useRef(null);
    const [image, setImage] = useState(null);
    const fileInputRef = useRef(null);

    // Use refs for mutable state to avoid re-renders during drag
    const state = useRef({
        x: 1024, // Center of 2048x2048
        y: 1024,
        scale: 1,
        dragging: false,
        lastX: 0,
        lastY: 0
    });
    const lastUpdate = useRef(0);
    const [scale, setScale] = useState(1); // Track scale for display

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        // Clear canvas (transparent)
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (image) {
            const { x, y, scale } = state.current;
            const w = image.width * scale;
            const h = image.height * scale;

            // Draw image centered at x, y
            ctx.drawImage(image, x - w / 2, y - h / 2, w, h);
        }


        const now = Date.now();
        if (now - lastUpdate.current > 50) { // Limit to ~20fps
            onUpdate(canvas);
            lastUpdate.current = now;
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = 2048;
        canvas.height = 2048;
        draw();
    }, [image]);

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const img = new Image();
            img.onload = () => {
                setImage(img);
                // Reset position/scale on new image
                state.current = { ...state.current, x: 1024, y: 1024, scale: 1 };
                setScale(1);
                draw();
            };
            img.src = URL.createObjectURL(file);
        }
    };

    const handleMouseDown = (e) => {
        state.current.dragging = true;
        state.current.lastX = e.clientX;
        state.current.lastY = e.clientY;
    };

    const handleMouseUp = () => {
        state.current.dragging = false;
        // Ensure final update
        if (canvasRef.current) {
            onUpdate(canvasRef.current);
        }
    };

    const handleMouseMove = (e) => {
        if (!state.current.dragging) return;

        // Calculate delta
        const dx = e.clientX - state.current.lastX;
        const dy = e.clientY - state.current.lastY;

        // Update last pos
        state.current.lastX = e.clientX;
        state.current.lastY = e.clientY;

        // Scale factor: Canvas is 2048, Display is responsive now
        const canvas = canvasRef.current;
        const displaySize = canvas.getBoundingClientRect().width;
        const ratio = 2048 / displaySize;

        state.current.x += dx * ratio;
        state.current.y += dy * ratio;

        draw();
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const scaleSpeed = 0.001;
        const newScale = state.current.scale - e.deltaY * scaleSpeed;
        state.current.scale = Math.max(0.1, Math.min(5, newScale));
        setScale(state.current.scale);
        draw();
    };

    const handleZoomIn = () => {
        const newScale = Math.min(5, state.current.scale + 0.1);
        state.current.scale = newScale;
        setScale(newScale);
        draw();
    };

    const handleZoomOut = () => {
        const newScale = Math.max(0.1, state.current.scale - 0.1);
        state.current.scale = newScale;
        setScale(newScale);
        draw();
    };

    // Touch event handlers for mobile
    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            state.current.dragging = true;
            state.current.lastX = touch.clientX;
            state.current.lastY = touch.clientY;
        }
    };

    const handleTouchMove = (e) => {
        if (!state.current.dragging || e.touches.length !== 1) return;
        e.preventDefault();

        const touch = e.touches[0];
        const dx = touch.clientX - state.current.lastX;
        const dy = touch.clientY - state.current.lastY;

        state.current.lastX = touch.clientX;
        state.current.lastY = touch.clientY;

        const canvas = canvasRef.current;
        const displaySize = canvas.getBoundingClientRect().width;
        const ratio = 2048 / displaySize;

        state.current.x += dx * ratio;
        state.current.y += dy * ratio;

        draw();
    };

    const handleTouchEnd = () => {
        state.current.dragging = false;
        if (canvasRef.current) {
            onUpdate(canvasRef.current);
        }
    };

    return (
        <div className="flex flex-col gap-4 items-center w-full max-w-3xl">
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onMouseMove={handleMouseMove}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                className="w-full max-w-[min(80vh,700px)] aspect-square border-2 border-border rounded-lg cursor-move"
                style={{
                    background: "url('/designs/Template.png')",
                    backgroundSize: "cover",
                }}
            />

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full px-4">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                />
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="default"
                    className="w-full sm:w-auto"
                >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                </Button>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleZoomOut}
                        variant="outline"
                        size="icon"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[100px] text-center text-sm font-medium">
                        {(scale * 100).toFixed(0)}%
                    </span>
                    <Button
                        onClick={handleZoomIn}
                        variant="outline"
                        size="icon"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
