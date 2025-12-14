"use client";

import { useEffect, Suspense, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Decal,
  OrbitControls,
  useTexture,
  useGLTF,
  Center,
  Text,
} from "@react-three/drei";
import * as THREE from "three";

// Preload models
useGLTF.preload("/models/oversized_t-shirt.glb");
useGLTF.preload("/models/hoodie.glb");

// ---------- DECAL LAYER ----------

// ---------- VIEW DECAL COMPONENT (Full Texture Mapping) ----------

function ViewDecal({ elements, position, rotation, scale, meshRef }: any) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    if (!elements || elements.length === 0) {
      setTexture(null);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load all images first
    const loadImages = elements.filter((e: any) => e.type === 'image').map((e: any) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = e.url;
        img.onload = () => resolve({ id: e.id, img });
        img.onerror = () => resolve({ id: e.id, img: null });
      });
    });

    Promise.all(loadImages).then((loadedImages: any) => {
      const imgMap = loadedImages.reduce((acc: any, item: any) => ({ ...acc, [item.id]: item.img }), {});

      // Clear canvas
      ctx.clearRect(0, 0, 1024, 1024);

      // Draw all elements in order
      elements.forEach((el: any) => {
        ctx.save();

        // Map 2D coordinates (-1 to 1) to Canvas (0 to 1024)
        // PatternGuide: x=0, y=0 is center.
        const cx = (el.x + 1) * 512;
        const cy = (el.y + 1) * 512;

        ctx.translate(cx, cy);
        ctx.rotate(el.rotation * Math.PI / 180);
        ctx.scale(el.scale, el.scale);

        if (el.type === 'image') {
          const img = imgMap[el.id];
          if (img) {
            // Base size 300px to match roughly with PatternGuide proportions
            ctx.drawImage(img, -150, -150, 300, 300);
          }
        } else {
          // Draw text
          const fontSize = (el.fontSize || 1) * 60; // Tuned scale factor
          ctx.font = `bold ${fontSize}px ${el.font || 'Arial'}`;
          ctx.fillStyle = el.color || '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (el.thickness && el.thickness > 0) {
            ctx.lineWidth = el.thickness * 2;
            ctx.strokeStyle = el.color || '#000000';
            ctx.strokeText(el.content, 0, 0);
          }
          ctx.fillText(el.content, 0, 0);
        }
        ctx.restore();
      });

      const tex = new THREE.CanvasTexture(canvas);
      tex.anisotropy = 16;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setTexture(tex);
    });

  }, [elements]);

  if (!texture) return null;

  return (
    <Decal
      position={position}
      rotation={rotation}
      scale={scale}
      mesh={meshRef}
    >
      <meshBasicMaterial
        map={texture}
        transparent
        polygonOffset
        polygonOffsetFactor={-4}
        depthTest={true}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </Decal>
  );
}

// ---------- SHIRT + TEXT COMPOSITION ----------

function ShirtMesh({ config, elements }: any) {
  const { type, color } = config;

  const isHoodie = type === "Hoodie";
  const modelUrl = isHoodie
    ? "/models/hoodie.glb"
    : "/models/oversized_t-shirt.glb";

  const { scene } = useGLTF(modelUrl) as any;
  const clone = scene.clone();

  // Ref to store the main mesh for Decals
  const meshRef = useRef<THREE.Mesh>(null);
  const [meshFound, setMeshFound] = useState(false);

  // Recolour the model with base color
  useEffect(() => {
    clone.traverse((node: any) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;

        // Store the first mesh we find as the target for decals
        if (!meshRef.current) {
          meshRef.current = node;
          setMeshFound(true); // Trigger re-render
        }

        if (node.material) {
          const newMaterial = node.material.clone();
          newMaterial.color.set(color);
          newMaterial.roughness = 0.7;
          newMaterial.metalness = 0.0;
          node.material = newMaterial;
        }
      }
    });
  }, [clone, color]);

  // 1. Vertical Alignment & Scale Tuning
  const modelScale = isHoodie ? 3.8 : 4.0;
  const yOffset = isHoodie ? -0.6 : -0.3;

  return (
    <group position={[0, yOffset, 0]} scale={modelScale}>
      <primitive object={clone} />

      {/* Render ViewDecals for each side - ONLY IF MESH IS FOUND */}
      {meshFound && (
        <>
          {/* FRONT VIEW */}
          <ViewDecal
            elements={elements.front}
            position={[0, isHoodie ? 0.15 : 0.2, 0.3]}
            rotation={[0, 0, 0]}
            scale={[0.6, 0.8, 1]}
            meshRef={meshRef}
          />

          {/* BACK VIEW */}
          <ViewDecal
            elements={elements.back}
            position={[0, isHoodie ? 0.15 : 0.2, -0.3]}
            rotation={[0, Math.PI, 0]}
            scale={[0.6, 0.8, 1]}
            meshRef={meshRef}
          />

          {/* LEFT SLEEVE */}
          <ViewDecal
            elements={elements.left}
            position={[isHoodie ? 0.4 : 0.5, 0.1, 0]}
            rotation={[0, 0, -Math.PI / 4]}
            scale={[0.4, 0.4, 1]}
            meshRef={meshRef}
          />

          {/* RIGHT SLEEVE */}
          <ViewDecal
            elements={elements.right}
            position={[isHoodie ? -0.4 : -0.5, 0.1, 0]}
            rotation={[0, 0, Math.PI / 4]}
            scale={[0.4, 0.4, 1]}
            meshRef={meshRef}
          />
        </>
      )}
    </group>
  );
}

// ---------- MAIN COMPONENT ----------

export default function ThreeDShirt({ config, elements }: any) {
  return (
    <div className="h-full w-full bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 relative">
      <div className="absolute top-4 right-4 z-10 bg-black/50 px-3 py-1 rounded text-xs text-white pointer-events-none">
        3D View - Drag to Rotate
      </div>
      <Canvas
        shadows
        camera={{ position: [0, 0.5, 4.5], fov: 40 }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <ambientLight intensity={0.8} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.5}
          penumbra={1}
          intensity={1.5}
          castShadow
        />
        <spotLight
          position={[-10, 10, -10]}
          angle={0.5}
          penumbra={1}
          intensity={1}
        />

        <Suspense fallback={null}>
          <ShirtMesh config={config} elements={elements} />
        </Suspense>

        <OrbitControls
          enableZoom={true}
          enablePan={true} // Allow panning to adjust view
          target={[0, 0.2, 0]} // Look at the center/chest area, not the feet
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
        />
      </Canvas>
    </div>
  );
}