"use client";

import { useState, useCallback } from "react";
import PatternGuide from "../../../components/customize/PatternGuide";
import { Loader2, UploadCloud, Save, ArrowLeft, Type, Trash2, Plus, Layers, RotateCcw, Redo2, Settings2, X, ChevronDown, ChevronUp, Copy, FlipHorizontal, FlipVertical, MoveUp, MoveDown, Sparkles, Palette, Ruler, Eye, EyeOff, Zap, HelpCircle } from "lucide-react";
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
  visible?: boolean;
}

// Expanded color palette with categories
const COLOR_PALETTE = {
  basics: [
    { color: '#ffffff', name: 'White' },
    { color: '#000000', name: 'Black' },
    { color: '#1a1a1a', name: 'Charcoal' },
    { color: '#4a4a4a', name: 'Gray' },
  ],
  vibrant: [
    { color: '#ef4444', name: 'Red' },
    { color: '#f97316', name: 'Orange' },
    { color: '#eab308', name: 'Yellow' },
    { color: '#22c55e', name: 'Green' },
    { color: '#3b82f6', name: 'Blue' },
    { color: '#8b5cf6', name: 'Purple' },
    { color: '#ec4899', name: 'Pink' },
    { color: '#14b8a6', name: 'Teal' },
  ],
  pastel: [
    { color: '#fecaca', name: 'Light Red' },
    { color: '#fed7aa', name: 'Peach' },
    { color: '#fef08a', name: 'Light Yellow' },
    { color: '#bbf7d0', name: 'Mint' },
    { color: '#bfdbfe', name: 'Sky' },
    { color: '#ddd6fe', name: 'Lavender' },
  ],
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

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

  // History for undo/redo
  const [history, setHistory] = useState<{ [key: string]: DesignElement[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Selected Element ID
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Mobile sidebar visibility
  const [showPropertiesOnMobile, setShowPropertiesOnMobile] = useState(false);

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    product: true,
    colors: true,
    size: false,
    layers: true,
    content: true,
    transform: true,
  });

  // Show layers panel
  const [showLayersPanel, setShowLayersPanel] = useState(false);

  // Helper to get selected element
  const selectedElement = elements[currentView].find(el => el.id === selectedId);

  // Save to history
  const saveToHistory = useCallback((newElements: { [key: string]: DesignElement[] }) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newElements)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  }, [history, historyIndex]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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
        x: 0, y: 0, scale: 1, rotation: 0,
        visible: true
      };
      const newElements = {
        ...elements,
        [currentView]: [...elements[currentView], newElement]
      };
      setElements(newElements);
      saveToHistory(newElements);
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
      content: "Your Text",
      x: 0, y: 0, scale: 1, rotation: 0,
      fontSize: 1.5,
      color: "#000000",
      font: "Arial",
      thickness: 0,
      visible: true
    };
    const newElements = {
      ...elements,
      [currentView]: [...elements[currentView], newElement]
    };
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedId(newElement.id);
    toast.success("Text element added!");
  };

  const updateElement = (field: keyof DesignElement, value: any) => {
    if (!selectedId) return;
    const newElements = {
      ...elements,
      [currentView]: elements[currentView].map(el => el.id === selectedId ? { ...el, [field]: value } : el)
    };
    setElements(newElements);
  };

  const deleteElement = () => {
    if (!selectedId) return;
    const newElements = {
      ...elements,
      [currentView]: elements[currentView].filter(el => el.id !== selectedId)
    };
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedId(null);
    toast.success("Element deleted");
  };

  const duplicateElement = () => {
    if (!selectedElement) return;
    const newElement = {
      ...selectedElement,
      id: crypto.randomUUID(),
      x: selectedElement.x + 0.1,
      y: selectedElement.y + 0.1
    };
    const newElements = {
      ...elements,
      [currentView]: [...elements[currentView], newElement]
    };
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedId(newElement.id);
    toast.success("Element duplicated");
  };

  const moveLayer = (direction: 'up' | 'down') => {
    if (!selectedId) return;
    const currentElements = [...elements[currentView]];
    const index = currentElements.findIndex(el => el.id === selectedId);
    if (direction === 'up' && index < currentElements.length - 1) {
      [currentElements[index], currentElements[index + 1]] = [currentElements[index + 1], currentElements[index]];
    } else if (direction === 'down' && index > 0) {
      [currentElements[index], currentElements[index - 1]] = [currentElements[index - 1], currentElements[index]];
    }
    const newElements = { ...elements, [currentView]: currentElements };
    setElements(newElements);
    saveToHistory(newElements);
  };

  const toggleVisibility = (id: string) => {
    const newElements = {
      ...elements,
      [currentView]: elements[currentView].map(el => el.id === id ? { ...el, visible: !el.visible } : el)
    };
    setElements(newElements);
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

  // Collapsible Section Component
  const Section = ({ title, icon: Icon, sectionKey, children }: { title: string; icon: any; sectionKey: keyof typeof expandedSections; children: React.ReactNode }) => (
    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/50">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <Icon size={16} className="text-purple-400" />
          {title}
        </div>
        {expandedSections[sectionKey] ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>
      {expandedSections[sectionKey] && (
        <div className="p-4 pt-2 border-t border-zinc-800 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );

  // Premium Slider Component
  const PremiumSlider = ({ label, value, min, max, step, onChange, unit = '' }: { label: string; value: number; min: number; max: number; step: number; onChange: (val: number) => void; unit?: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className="text-purple-400 font-bold tabular-nums">{value.toFixed(step < 1 ? 2 : 0)}{unit}</span>
      </div>
      <div className="relative">
        <input
          type="range" min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
            [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-pink-500
            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/30
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110"
        />
        <div
          className="absolute top-0 left-0 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full pointer-events-none"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white flex flex-col">

      {/* --- GLASSMORPHISM TOOLBAR --- */}
      <div className="h-16 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800/50 flex items-center justify-between px-3 sm:px-6 z-50 sticky top-0 shadow-2xl shadow-black/20">

        {/* Left: Back Button & Logo */}
        <div className="flex items-center gap-3">
          <Link href="/customize" className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 group">
            <ArrowLeft size={20} className="text-gray-400 group-hover:text-white transition-colors" />
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-wide">DESIGN STUDIO</span>
          </div>
        </div>

        {/* Center: Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="hidden sm:flex items-center gap-1 mr-2">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw size={16} className="text-gray-400" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={16} className="text-gray-400" />
            </button>
          </div>

          <button
            onClick={addText}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all border border-zinc-700/50 hover:border-zinc-600 hover:shadow-lg hover:shadow-purple-500/10"
          >
            <Type size={16} className="text-purple-400" />
            <span className="hidden sm:inline">Add Text</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs sm:text-sm font-semibold cursor-pointer transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02]">
            {uploading ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
            <span className="hidden sm:inline">Upload</span>
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept="image/*" />
          </label>

          {/* Layers toggle */}
          <button
            onClick={() => setShowLayersPanel(!showLayersPanel)}
            className={`p-2.5 rounded-xl transition-all border ${showLayersPanel ? 'bg-purple-600 border-purple-500 text-white' : 'bg-zinc-800/80 border-zinc-700/50 text-gray-400 hover:bg-zinc-700'}`}
            title="Toggle Layers Panel"
          >
            <Layers size={16} />
          </button>
        </div>

        {/* Right: Settings & Save */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPropertiesOnMobile(!showPropertiesOnMobile)}
            className="lg:hidden p-2.5 hover:bg-white/10 rounded-xl transition-all"
          >
            <Settings2 size={18} className="text-gray-400" />
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/25 flex items-center gap-2 transition-all text-xs hover:shadow-red-500/40 hover:scale-[1.02] disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            <span className="hidden sm:inline">SAVE</span>
          </button>
        </div>
      </div>

      {/* Backdrop overlay for mobile sidebar */}
      {(selectedId || showPropertiesOnMobile) && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => {
            setSelectedId(null);
            setShowPropertiesOnMobile(false);
          }}
        />
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* LAYERS PANEL (Left side) */}
        {showLayersPanel && (
          <div className="w-64 bg-zinc-900/90 backdrop-blur-xl border-r border-zinc-800/50 flex flex-col animate-in slide-in-from-left-5 duration-300">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Layers size={16} className="text-purple-400" />
                Layers
              </h3>
              <span className="text-xs text-gray-500 bg-zinc-800 px-2 py-1 rounded-full">
                {elements[currentView].length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {elements[currentView].length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  <Layers size={32} className="mx-auto mb-2 opacity-30" />
                  No elements yet.<br />Add text or images!
                </div>
              ) : (
                [...elements[currentView]].reverse().map((el, idx) => (
                  <div
                    key={el.id}
                    onClick={() => setSelectedId(el.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 group ${selectedId === el.id
                        ? 'bg-purple-600/20 border border-purple-500/50'
                        : 'hover:bg-zinc-800 border border-transparent'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${el.type === 'image' ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
                      {el.type === 'image' ? (
                        <img src={el.url} alt="" className="w-6 h-6 object-cover rounded" />
                      ) : (
                        <Type size={14} className="text-green-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {el.type === 'text' ? el.content : 'Image'}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {el.type === 'text' ? el.font : 'Uploaded'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(el.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition-all"
                    >
                      {el.visible !== false ? <Eye size={12} className="text-gray-400" /> : <EyeOff size={12} className="text-gray-500" />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CENTER CANVAS */}
        <div className="flex-1 overflow-y-auto relative">
          <PatternGuide
            design={productConfig}
            elements={elements}
            onSelect={setSelectedId}
            selectedId={selectedId}
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
        </div>

        {/* RIGHT SIDEBAR - PROPERTIES */}
        <div className={`fixed lg:relative top-0 right-0 h-full w-full sm:w-[400px] lg:w-[340px] bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-800/50 flex flex-col shadow-2xl z-50 transform transition-transform duration-300 ${selectedId || showPropertiesOnMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}>

          {/* Header */}
          <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-800/50">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Settings2 size={16} className="text-purple-400" />
              {selectedElement ? 'Element Properties' : 'Design Settings'}
            </h2>
            {(selectedId || showPropertiesOnMobile) && (
              <button onClick={() => {
                setSelectedId(null);
                setShowPropertiesOnMobile(false);
              }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* 1. Global Product Settings */}
            {!selectedId && (
              <>
                <Section title="Product Type" icon={Sparkles} sectionKey="product">
                  <div className="grid grid-cols-2 gap-2">
                    {['T-Shirt', 'Hoodie'].map(type => (
                      <button
                        key={type}
                        onClick={() => setProductConfig({ ...productConfig, type })}
                        className={`p-3 rounded-xl text-sm font-semibold transition-all ${productConfig.type === type
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                            : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 border border-zinc-700'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Base Color" icon={Palette} sectionKey="colors">
                  <div className="space-y-4">
                    {/* Basic Colors */}
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Basics</p>
                      <div className="flex gap-2 flex-wrap">
                        {COLOR_PALETTE.basics.map(({ color, name }) => (
                          <button
                            key={color}
                            onClick={() => setProductConfig({ ...productConfig, color })}
                            className={`w-9 h-9 rounded-xl transition-all relative group ${productConfig.color === color ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-900 scale-110' : 'hover:scale-105'
                              }`}
                            style={{ backgroundColor: color, border: color === '#ffffff' ? '1px solid #374151' : 'none' }}
                            title={name}
                          >
                            {productConfig.color === color && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className={`w-2 h-2 rounded-full ${color === '#ffffff' || color === '#fef08a' ? 'bg-black' : 'bg-white'}`} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Vibrant Colors */}
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Vibrant</p>
                      <div className="flex gap-2 flex-wrap">
                        {COLOR_PALETTE.vibrant.map(({ color, name }) => (
                          <button
                            key={color}
                            onClick={() => setProductConfig({ ...productConfig, color })}
                            className={`w-9 h-9 rounded-xl transition-all ${productConfig.color === color ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-900 scale-110' : 'hover:scale-105'
                              }`}
                            style={{ backgroundColor: color }}
                            title={name}
                          >
                            {productConfig.color === color && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Color Picker */}
                    <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
                      <input
                        type="color"
                        value={productConfig.color}
                        onChange={(e) => setProductConfig({ ...productConfig, color: e.target.value })}
                        className="w-10 h-10 rounded-lg cursor-pointer border-none"
                      />
                      <div>
                        <p className="text-xs font-medium">Custom Color</p>
                        <p className="text-[10px] text-gray-500 font-mono uppercase">{productConfig.color}</p>
                      </div>
                    </div>
                  </div>
                </Section>

                <Section title="Size" icon={Ruler} sectionKey="size">
                  <div className="flex gap-2 flex-wrap">
                    {SIZES.map(size => (
                      <button
                        key={size}
                        onClick={() => setProductConfig({ ...productConfig, size })}
                        className={`w-12 h-12 rounded-xl font-bold text-sm transition-all ${productConfig.size === size
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                            : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700 border border-zinc-700'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Quick Tips */}
                <div className="p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-500/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <HelpCircle size={16} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-purple-300 mb-1">Quick Tip</p>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        Click on Front, Back, or Sleeve tabs to switch views. Add text or upload images to start designing!
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 2. Selected Element Settings */}
            {selectedElement && (
              <>
                {/* Quick Actions */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={duplicateElement}
                    className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-medium transition-all border border-zinc-700"
                  >
                    <Copy size={14} className="text-blue-400" /> Duplicate
                  </button>
                  <button
                    onClick={() => moveLayer('up')}
                    className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all border border-zinc-700"
                    title="Move Up"
                  >
                    <MoveUp size={14} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => moveLayer('down')}
                    className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all border border-zinc-700"
                    title="Move Down"
                  >
                    <MoveDown size={14} className="text-gray-400" />
                  </button>
                </div>

                <Section title="Content & Style" icon={Type} sectionKey="content">
                  {selectedElement.type === 'text' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Text Content</label>
                        <input
                          type="text"
                          value={selectedElement.content}
                          onChange={(e) => updateElement("content", e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-xl text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-white"
                          placeholder="Enter your text..."
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Font Family</label>
                        <select
                          value={selectedElement.font}
                          onChange={(e) => updateElement("font", e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-xl text-sm focus:border-purple-500 outline-none text-white cursor-pointer"
                        >
                          <option value="Arial">Arial</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Verdana">Verdana</option>
                          <option value="Impact">Impact</option>
                          <option value="Courier New">Courier New</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Comic Sans MS">Comic Sans</option>
                          <option value="Times New Roman">Times New Roman</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">Element Color</label>
                    <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
                      <input
                        type="color"
                        value={selectedElement.color || "#000000"}
                        onChange={(e) => updateElement("color", e.target.value)}
                        className="w-12 h-12 rounded-xl cursor-pointer border-2 border-zinc-700"
                      />
                      <div>
                        <p className="text-xs font-medium">Selected Color</p>
                        <p className="text-[10px] text-gray-500 font-mono uppercase">{selectedElement.color}</p>
                      </div>
                    </div>
                  </div>
                </Section>

                <Section title="Transform" icon={Zap} sectionKey="transform">
                  <div className="space-y-5">
                    <PremiumSlider
                      label={selectedElement.type === 'text' ? "Font Size" : "Scale"}
                      value={selectedElement.type === 'text' ? (selectedElement.fontSize || 1) : selectedElement.scale}
                      min={0.1}
                      max={5}
                      step={0.1}
                      onChange={(v) => updateElement(selectedElement.type === 'text' ? "fontSize" : "scale", v)}
                      unit="x"
                    />

                    <PremiumSlider
                      label="Rotation"
                      value={selectedElement.rotation}
                      min={0}
                      max={360}
                      step={5}
                      onChange={(v) => updateElement("rotation", v)}
                      unit="°"
                    />

                    <PremiumSlider
                      label="Horizontal Position"
                      value={selectedElement.x}
                      min={-1}
                      max={1}
                      step={0.05}
                      onChange={(v) => updateElement("x", v)}
                    />

                    <PremiumSlider
                      label="Vertical Position"
                      value={selectedElement.y}
                      min={-1}
                      max={1}
                      step={0.05}
                      onChange={(v) => updateElement("y", v)}
                    />

                    {selectedElement.type === 'text' && (
                      <PremiumSlider
                        label="Text Outline"
                        value={selectedElement.thickness || 0}
                        min={0}
                        max={5}
                        step={0.5}
                        onChange={(v) => updateElement("thickness", v)}
                        unit="px"
                      />
                    )}
                  </div>
                </Section>

                {/* Delete Button */}
                <button
                  onClick={deleteElement}
                  className="w-full py-3 bg-red-950/50 border border-red-900/50 text-red-400 hover:bg-red-900/50 hover:border-red-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 size={16} /> Delete Element
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}