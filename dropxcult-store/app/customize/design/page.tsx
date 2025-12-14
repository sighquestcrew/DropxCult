"use client";

import { useState } from "react";
import PatternGuide from "../../../components/customize/PatternGuide";
import { Loader2, UploadCloud, Save, ArrowLeft, Image as ImageIcon, Type, Trash2, Plus, Layers, RotateCcw, Download, Settings2, X } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import Link from "next/link";

interface DesignElement {
  id: string;
  type: 'image' | 'text';
  url?: string;
  content?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color?: string;
  font?: string;
  fontSize?: number;
  thickness?: number;
}

export default function DesignPage() {
  const router = useRouter();
  const { userInfo } = useSelector((state: RootState) => state.auth);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Track which side we are looking at (Active View)
  const [currentView, setCurrentView] = useState<"front" | "back" | "left" | "right">("front");

  // Product Config
  const [productConfig, setProductConfig] = useState({
    type: "T-Shirt",
    color: "#ffffff",
    size: "L",
  });

  // Elements State (Layers)
  const [elements, setElements] = useState<{ [key: string]: DesignElement[] }>({
    front: [],
    back: [],
    left: [],
    right: [],
  });

  // Selected Element ID
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Mobile sidebar visibility (for accessing settings without selecting an element)
  const [showPropertiesOnMobile, setShowPropertiesOnMobile] = useState(false);

  // Helper to get selected element
  const selectedElement = elements[currentView].find(el => el.id === selectedId);

  const handleUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axios.post("/api/upload", formData);
      const newElement: DesignElement = {
        id: crypto.randomUUID(),
        type: 'image',
        url: data.url,
        x: 0, y: 0, scale: 1, rotation: 0
      };
      setElements(prev => ({
        ...prev,
        [currentView]: [...prev[currentView], newElement]
      }));
      setSelectedId(newElement.id);
      toast.success(`Image added to ${currentView}!`);
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addText = () => {
    const newElement: DesignElement = {
      id: crypto.randomUUID(),
      type: 'text',
      content: "New Text",
      x: 0, y: 0, scale: 1, rotation: 0,
      fontSize: 1,
      color: "#000000",
      font: "Arial",
      thickness: 0
    };
    setElements(prev => ({
      ...prev,
      [currentView]: [...prev[currentView], newElement]
    }));
    setSelectedId(newElement.id);
  };

  const updateElement = (field: keyof DesignElement, value: any) => {
    if (!selectedId) return;
    setElements(prev => ({
      ...prev,
      [currentView]: prev[currentView].map(el => el.id === selectedId ? { ...el, [field]: value } : el)
    }));
  };

  const deleteElement = () => {
    if (!selectedId) return;
    setElements(prev => ({
      ...prev,
      [currentView]: prev[currentView].filter(el => el.id !== selectedId)
    }));
    setSelectedId(null);
  };

  const handleSubmit = async () => {
    if (!userInfo) {
      toast.error("Login required to save designs");
      router.push("/login");
      return;
    }
    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      const payload = {
        ...productConfig,
        layers: elements,
        frontImage: elements.front.find(e => e.type === 'image')?.url || "",
        backImage: elements.back.find(e => e.type === 'image')?.url || "",
        leftSleeveImage: elements.left.find(e => e.type === 'image')?.url || "",
        rightSleeveImage: elements.right.find(e => e.type === 'image')?.url || "",
      };

      await axios.post("/api/customize", payload, config);
      toast.success("Design Request Sent!");
      router.push("/customize");
    } catch (error) {
      toast.error("Failed to save design");
    } finally {
      setSaving(false);
    }
  };

  const renderSlider = (label: string, value: number, min: number, max: number, step: number, onChange: (val: number) => void) => (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-gray-500 mb-1 font-bold uppercase">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-black h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">

      {/* --- TOP TOOLBAR --- */}
      <div className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-3 sm:px-6 shadow-sm z-50 sticky top-0">

        {/* Left: Back Button */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/customize" className="p-2 hover:bg-zinc-800 rounded-full transition">
            <ArrowLeft size={20} className="text-gray-400" />
          </Link>
        </div>

        {/* Center: Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={addText}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full text-xs sm:text-sm font-bold transition border border-zinc-700"
          >
            <Type size={16} /> <span className="hidden sm:inline">Add Text</span>
          </button>

          <label className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-full text-xs sm:text-sm font-bold cursor-pointer transition shadow-md">
            {uploading ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
            <span className="hidden sm:inline">Upload</span>
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        {/* Right: Settings (Mobile) & Save */}
        <div className="flex items-center gap-2">
          {/* Settings button for mobile */}
          <button
            onClick={() => setShowPropertiesOnMobile(!showPropertiesOnMobile)}
            className="lg:hidden p-2 hover:bg-zinc-800 rounded-full transition"
          >
            <Settings2 size={20} className="text-gray-400" />
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="p-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-lg flex items-center gap-2 transition text-xs"
          >
            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            SAVE
          </button>
        </div>
      </div>

      {/* Backdrop overlay for mobile sidebar */}
      {(selectedId || showPropertiesOnMobile) && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => {
            setSelectedId(null);
            setShowPropertiesOnMobile(false);
          }}
        />
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex overflow-hidden relative bg-zinc-950">

        {/* CENTER CANVAS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <PatternGuide
            design={productConfig}
            elements={elements}
            onSelect={setSelectedId}
            selectedId={selectedId}
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
        </div>

        {/* RIGHT SIDEBAR - PROPERTIES (Hidden on mobile, overlay when visible) */}
        <div className={`fixed lg:relative top-0 right-0 h-full w-full sm:w-96 lg:w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-xl z-50 transform transition-transform duration-300 ${selectedId || showPropertiesOnMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}>

          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-800">
            <h2 className="font-bold text-sm uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Settings2 size={16} /> Properties
            </h2>
            {(selectedId || showPropertiesOnMobile) && (
              <button onClick={() => {
                setSelectedId(null);
                setShowPropertiesOnMobile(false);
              }} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">

            {/* 1. Global Product Settings */}
            {!selectedId && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Product Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['T-Shirt', 'Hoodie'].map(type => (
                      <button
                        key={type}
                        onClick={() => setProductConfig({ ...productConfig, type })}
                        className={`p-2 rounded border text-sm font-medium transition ${productConfig.type === type ? 'bg-white text-black border-white' : 'bg-zinc-800 text-gray-400 border-zinc-700 hover:border-zinc-600'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Base Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {['#ffffff', '#000000', '#ff0000', '#0000ff', '#ffff00', '#808080'].map(c => (
                      <button
                        key={c}
                        onClick={() => setProductConfig({ ...productConfig, color: c })}
                        className={`w-8 h-8 rounded-full border-2 transition ${productConfig.color === c ? 'border-gray-400 scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: c, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                      />
                    ))}
                    <input
                      type="color"
                      value={productConfig.color}
                      onChange={(e) => setProductConfig({ ...productConfig, color: e.target.value })}
                      className="w-8 h-8 rounded-full cursor-pointer opacity-0 absolute"
                    />
                    <div className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center text-gray-400 bg-zinc-800 hover:bg-zinc-700 cursor-pointer pointer-events-none">
                      <Plus size={14} />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 text-xs text-gray-400 leading-relaxed">
                  <p className="font-bold mb-1 text-gray-300">Tip:</p>
                  Select a part of the shirt (Front, Back, etc.) to start adding designs. Click on an added element to edit its properties.
                </div>
              </div>
            )}

            {/* 2. Selected Element Settings */}
            {selectedElement && (
              <div className="space-y-6 animate-in slide-in-from-right-5">

                {/* Content & Style */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Content & Style</label>
                  {selectedElement.type === 'text' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={selectedElement.content}
                        onChange={(e) => updateElement("content", e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 p-2 rounded text-sm focus:border-white outline-none transition text-white"
                        placeholder="Enter text..."
                      />
                      <select
                        value={selectedElement.font}
                        onChange={(e) => updateElement("font", e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 p-2 rounded text-sm focus:border-white outline-none text-white"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Impact">Impact</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                      </select>
                    </div>
                  )}
                  <div className="mt-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedElement.color || "#000000"}
                        onChange={(e) => updateElement("color", e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-none"
                      />
                      <span className="text-xs font-mono text-gray-400">{selectedElement.color}</span>
                    </div>
                  </div>
                </div>

                <hr className="border-zinc-800" />

                {/* Transformations */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-4 block">Transform</label>

                  {renderSlider("Size / Scale", selectedElement.type === 'text' ? (selectedElement.fontSize || 1) : selectedElement.scale, 0.1, 5, 0.1, (v) => updateElement(selectedElement.type === 'text' ? "fontSize" : "scale", v))}

                  {renderSlider("Rotation", selectedElement.rotation, 0, 360, 5, (v) => updateElement("rotation", v))}

                  {renderSlider("Horizontal (X)", selectedElement.x, -1, 1, 0.05, (v) => updateElement("x", v))}

                  {renderSlider("Vertical (Y)", selectedElement.y, -1, 1, 0.05, (v) => updateElement("y", v))}

                  {selectedElement.type === 'text' && renderSlider("Outline Thickness", selectedElement.thickness || 0, 0, 5, 0.5, (v) => updateElement("thickness", v))}
                </div>

                <hr className="border-zinc-800" />

                <button
                  onClick={deleteElement}
                  className="w-full py-2 border border-red-900 bg-red-950 text-red-400 hover:bg-red-900 rounded text-sm font-bold flex items-center justify-center gap-2 transition"
                >
                  <Trash2 size={16} /> Delete Element
                </button>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}