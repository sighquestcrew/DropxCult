"use client";
import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { Button } from "@/components/ui/button";
import { Upload, Type, ZoomIn, ZoomOut, Trash2, Save, FolderOpen, Download, FilePlus, Database, RotateCw, RotateCcw, Wand2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import JSZip from "jszip";
import { getUserFromUrl, getUserFromSession, saveUserToSession } from "@/lib/auth";
import { removeBackground } from "@imgly/background-removal";
import { useToast } from "@/components/ui/toast";

export default function FabricCanvas({ onUpdate, tshirtColor = "#ffffff", backgroundImage = "/designs/Template.png", tshirtType = "regular", onLoad, onGetSnapshot }) {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const fileInputRef = useRef(null);
    const [selectedObject, setSelectedObject] = useState(null);
    const lastUpdate = useRef(0);
    const tshirtColorRef = useRef(tshirtColor); // Keep track of current color in a ref

    // Project State
    const [projectName, setProjectName] = useState("tshirt-project");
    const [fileHandle, setFileHandle] = useState(null);
    const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");

    // User Authentication
    const [currentUser, setCurrentUser] = useState(null);
    const [currentDesignId, setCurrentDesignId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isCloudSaveModalOpen, setIsCloudSaveModalOpen] = useState(false);
    const [cloudSaveName, setCloudSaveName] = useState("");

    // Text editing states
    const [textColor, setTextColor] = useState("#000000");
    const [fontSize, setFontSize] = useState(200); // Increased default font size
    const [fontFamily, setFontFamily] = useState("Arial");
    const [isRemovingBg, setIsRemovingBg] = useState(false); // Background removal loading state

    const isInitialized = useRef(false);
    const toast = useToast();

    // Initialize user auth on mount
    // Initialize user auth and load design on mount
    useEffect(() => {
        // 1. Handle User Auth
        const urlUser = getUserFromUrl();
        if (urlUser) {
            saveUserToSession(urlUser);
            setCurrentUser(urlUser);
        } else {
            const sessionUser = getUserFromSession();
            if (sessionUser) {
                setCurrentUser(sessionUser);
            }
        }

        // 2. Handle Design Loading
        const params = new URLSearchParams(window.location.search);
        const designId = params.get('designId');
        if (designId) {
            // Get current user before loading design
            const user = urlUser || getUserFromSession();
            loadDesignFromId(designId, user);
        }
    }, []);

    // Re-render when tshirt color changes
    useEffect(() => {
        tshirtColorRef.current = tshirtColor; // Keep ref in sync with prop
        if (fabricRef.current) {
            updateTexture();
        }
    }, [tshirtColor]);

    useEffect(() => {
        // Prevent double initialization in Strict Mode
        if (isInitialized.current) return;
        isInitialized.current = true;

        // Add error handler for fabric blob URL errors (they're non-fatal)
        const handleError = (event) => {
            if (event.message && event.message.includes('Error loading blob:')) {
                console.warn('Suppressed fabric blob loading error:', event.message);
                event.preventDefault();
                return true;
            }
        };
        window.addEventListener('error', handleError);

        // Configure Fabric for mobile
        fabric.Object.prototype.set({
            transparentCorners: false,
            cornerColor: '#ffffff',
            cornerStrokeColor: '#000000',
            borderColor: '#000000',
            cornerSize: 40, // Increased for mobile
            touchCornerSize: 80, // Much larger for reliable mobile touch
            padding: 20, // More padding for easier grabbing
            cornerStyle: 'circle'
        });

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 2048,
            height: 2048,
            backgroundColor: 'transparent',
            preserveObjectStacking: true,
            enableRetinaScaling: false // Ensure consistent coordinates
        });

        // Handle responsive scaling
        const resizeCanvas = () => {
            const container = canvasRef.current?.parentElement;
            if (container) {
                const { width, height } = container.getBoundingClientRect();
                // We keep the internal resolution at 2048, but scale the display
                const scale = width / 2048;
                canvas.setDimensions({ width: 2048, height: 2048 });
                canvas.setZoom(1); // Reset zoom to 1, we handle display via CSS

                // Force CSS size
                const canvasEl = canvas.getElement();
                canvasEl.style.width = '100%';
                canvasEl.style.height = '100%';
                canvasEl.style.touchAction = 'none'; // CRITICAL: Prevent browser scroll on canvas

                // Also style the wrapper Fabric creates
                const upperCanvas = canvas.upperCanvasEl;
                if (upperCanvas) {
                    upperCanvas.style.width = '100%';
                    upperCanvas.style.height = '100%';
                    upperCanvas.style.touchAction = 'none'; // CRITICAL
                }
                const wrapper = canvasEl.parentElement;
                if (wrapper) {
                    wrapper.style.width = '100%';
                    wrapper.style.height = '100%';
                }
            }
        };

        // Initial resize
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        fabricRef.current = canvas;

        // Selection event
        canvas.on('selection:created', (e) => {
            setSelectedObject(e.selected[0]);
        });

        canvas.on('selection:updated', (e) => {
            setSelectedObject(e.selected[0]);
        });

        canvas.on('selection:cleared', () => {
            setSelectedObject(null);
        });

        // Throttled update on modification
        canvas.on('object:modified', throttledUpdate);
        canvas.on('object:added', throttledUpdate);
        canvas.on('object:removed', throttledUpdate);

        // Mouse Wheel Zoom for selected object
        canvas.on('mouse:wheel', (opt) => {
            const evt = opt.e;
            evt.preventDefault();
            evt.stopPropagation();

            const activeObject = canvas.getActiveObject();
            if (activeObject) {
                const delta = evt.deltaY;
                let scale = activeObject.scaleX;
                scale += delta > 0 ? -0.1 : 0.1;
                scale = Math.max(0.1, Math.min(scale, 5));
                activeObject.scale(scale);
                canvas.requestRenderAll();
                throttledUpdate();
            }
        });

        // Touch Gesture Support (Pinch to Resize)
        let initialPinchDistance = 0;
        let initialScale = 1;

        const getDistance = (touches) => {
            const [t1, t2] = touches;
            const dx = t2.clientX - t1.clientX;
            const dy = t2.clientY - t1.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        const canvasEl = canvas.upperCanvasEl;

        const handleTouchStart = (e) => {
            if (e.touches.length === 2) {
                const activeObject = canvas.getActiveObject();
                if (activeObject) {
                    initialPinchDistance = getDistance(e.touches);
                    initialScale = activeObject.scaleX;
                    e.preventDefault(); // Prevent default browser pinch zoom
                }
            }
        };

        const handleTouchMove = (e) => {
            if (e.touches.length === 2) {
                const activeObject = canvas.getActiveObject();
                if (activeObject && initialPinchDistance > 0) {
                    const currentDistance = getDistance(e.touches);
                    const scaleFactor = currentDistance / initialPinchDistance;
                    let newScale = initialScale * scaleFactor;

                    // Clamp scale
                    newScale = Math.max(0.1, Math.min(newScale, 5));

                    activeObject.scale(newScale);
                    canvas.requestRenderAll();
                    throttledUpdate();
                    e.preventDefault();
                }
            }
        };

        const handleTouchEnd = () => {
            initialPinchDistance = 0;
        };

        if (canvasEl) {
            canvasEl.addEventListener('touchstart', handleTouchStart, { passive: false });
            canvasEl.addEventListener('touchmove', handleTouchMove, { passive: false });
            canvasEl.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (canvasEl) {
                canvasEl.removeEventListener('touchstart', handleTouchStart);
                canvasEl.removeEventListener('touchmove', handleTouchMove);
                canvasEl.removeEventListener('touchend', handleTouchEnd);
            }
            // Only dispose if we authenticated the init
            if (isInitialized.current) {
                canvas.dispose();
                isInitialized.current = false;
            }
        };
    }, []);

    const throttledUpdate = () => {
        const now = Date.now();
        if (now - lastUpdate.current > 150) {
            updateTexture();
            lastUpdate.current = now;
        }
    };

    const isUpdatingRef = useRef(false);

    const updateTexture = () => {
        if (fabricRef.current && onUpdate && !isUpdatingRef.current) {
            isUpdatingRef.current = true;
            const canvas = fabricRef.current;

            // Save current selection and temporarily deselect (without triggering events)
            const activeObject = canvas.getActiveObject();
            if (activeObject) {
                canvas.discardActiveObject();
            }

            const dataURL = canvas.toDataURL({
                format: 'png',
                quality: 1
            });

            // Restore selection after a microtask (to avoid re-triggering)
            if (activeObject) {
                requestAnimationFrame(() => {
                    canvas.setActiveObject(activeObject);
                    canvas.requestRenderAll();
                    isUpdatingRef.current = false;
                });
            } else {
                isUpdatingRef.current = false;
            }

            // Convert data URL to canvas
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 2048;
                canvas.height = 2048;
                const ctx = canvas.getContext('2d');

                // Fill with T-shirt color (Solving the washout/transparency issue)
                ctx.fillStyle = tshirtColorRef.current;
                ctx.fillRect(0, 0, 2048, 2048);

                // Draw the design on top
                ctx.drawImage(img, 0, 0);

                onUpdate(canvas);
            };
            img.src = dataURL;
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && fabricRef.current) {
            const reader = new FileReader();
            reader.onload = (event) => {
                fabric.FabricImage.fromURL(event.target.result).then((img) => {
                    img.scaleToWidth(400);
                    img.set({
                        left: 1024,
                        top: 1024,
                        originX: 'center',
                        originY: 'center'
                    });
                    fabricRef.current.add(img);
                    fabricRef.current.setActiveObject(img);
                    fabricRef.current.renderAll();
                    updateTexture();
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const addText = () => {
        if (fabricRef.current) {
            const text = new fabric.IText('Your Text', {
                left: 1024,
                top: 1024,
                fontFamily: fontFamily,
                fontSize: fontSize,
                fill: textColor,
                originX: 'center',
                originY: 'center'
            });
            fabricRef.current.add(text);
            fabricRef.current.setActiveObject(text);
            fabricRef.current.renderAll();
            updateTexture();
        }
    };

    const deleteSelected = () => {
        const activeObject = fabricRef.current?.getActiveObject();
        if (activeObject) {
            fabricRef.current.remove(activeObject);
            fabricRef.current.renderAll();
            updateTexture();
        }
    };

    const updateSelectedText = (property, value) => {
        const activeObject = fabricRef.current?.getActiveObject();
        if (activeObject && activeObject.type === 'i-text') {
            activeObject.set(property, value);
            fabricRef.current.renderAll();
            updateTexture();
        }
    };

    const zoomIn = () => {
        const activeObject = fabricRef.current?.getActiveObject();
        if (activeObject) {
            activeObject.scale(activeObject.scaleX * 1.1);
            fabricRef.current.renderAll();
            updateTexture();
        }
    };

    const zoomOut = () => {
        const activeObject = fabricRef.current?.getActiveObject();
        if (activeObject) {
            activeObject.scale(activeObject.scaleX * 0.9);
            fabricRef.current.renderAll();
            updateTexture();
        }
    };

    const rotateLeft = () => {
        const activeObject = fabricRef.current?.getActiveObject();
        if (activeObject) {
            activeObject.rotate((activeObject.angle || 0) - 15);
            fabricRef.current.renderAll();
            updateTexture();
        }
    };

    const rotateRight = () => {
        const activeObject = fabricRef.current?.getActiveObject();
        if (activeObject) {
            activeObject.rotate((activeObject.angle || 0) + 15);
            fabricRef.current.renderAll();
            updateTexture();
        }
    };

    // Remove background from selected image
    const removeImageBg = async () => {
        const activeObject = fabricRef.current?.getActiveObject();
        if (!activeObject || activeObject.type !== 'image') {
            toast.warning('Please select an image first');
            return;
        }

        setIsRemovingBg(true);
        try {
            // Get the image source
            const imgElement = activeObject.getElement();
            const canvas = document.createElement('canvas');
            canvas.width = imgElement.naturalWidth || imgElement.width;
            canvas.height = imgElement.naturalHeight || imgElement.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgElement, 0, 0);

            // Convert to blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

            // Remove background
            const resultBlob = await removeBackground(blob, {
                progress: (key, current, total) => {
                    console.log(`Background removal: ${key} ${current}/${total}`);
                }
            });

            // Convert blob to base64 data URL (NOT a blob URL - those expire!)
            const dataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(resultBlob);
            });

            // Replace the image on canvas
            const img = new Image();
            img.onload = () => {
                // Store original position and scale
                const left = activeObject.left;
                const top = activeObject.top;
                const scaleX = activeObject.scaleX;
                const scaleY = activeObject.scaleY;
                const angle = activeObject.angle;

                // Remove old image
                fabricRef.current.remove(activeObject);

                // Add new image with removed background
                const newFabricImage = new fabric.FabricImage(img, {
                    left: left,
                    top: top,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    angle: angle,
                    cornerSize: 30,
                    transparentCorners: false,
                });

                fabricRef.current.add(newFabricImage);
                fabricRef.current.setActiveObject(newFabricImage);
                fabricRef.current.renderAll();
                updateTexture();
                setIsRemovingBg(false);
            };
            img.src = dataUrl; // Use base64 data URL instead of blob URL
        } catch (error) {
            console.error('Background removal failed:', error);
            toast.error('Failed to remove background. Please try again.');
            setIsRemovingBg(false);
        }
    };

    const generateZipBlob = async () => {
        if (!fabricRef.current) return null;

        const zip = new JSZip();
        const json = fabricRef.current.toJSON();
        const fabricObjects = fabricRef.current.getObjects();
        const imagesFolder = zip.folder("images");

        // Process objects to extract images
        const processedObjects = await Promise.all(json.objects.map(async (obj, index) => {
            if (obj.type === 'image') {
                try {
                    let blob;
                    // Try fetching first (preserves original format/quality)
                    if (obj.src) {
                        try {
                            const response = await fetch(obj.src);
                            if (response.ok) {
                                blob = await response.blob();
                            }
                        } catch (e) {
                            console.warn("Fetch failed, trying canvas extraction:", e);
                        }
                    }

                    // Fallback: Extract from canvas element
                    if (!blob) {
                        const fabricObj = fabricObjects[index];
                        if (fabricObj && fabricObj.getElement) {
                            const element = fabricObj.getElement();
                            const tempCanvas = document.createElement('canvas');
                            tempCanvas.width = element.naturalWidth || element.width;
                            tempCanvas.height = element.naturalHeight || element.height;
                            const ctx = tempCanvas.getContext('2d');
                            ctx.drawImage(element, 0, 0);

                            blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/png'));
                        }
                    }

                    if (blob) {
                        const fileName = `image_${index}.png`;
                        imagesFolder.file(fileName, blob);
                        return { ...obj, src: `images/${fileName}` };
                    }
                } catch (error) {
                    console.error("Failed to bundle image:", error);
                    return obj;
                }
            }
            return obj;
        }));

        json.objects = processedObjects;
        zip.file("design.json", JSON.stringify(json));
        // Save metadata
        const metadata = {
            version: "1.0.0",
            type: tshirtType,
            color: tshirtColor,
            timestamp: new Date().toISOString()
        };
        zip.file("metadata.json", JSON.stringify(metadata, null, 2));

        return await zip.generateAsync({ type: "blob" });
    };

    // Cloud Save Functions
    const initiateSave = () => {
        if (!currentUser) {
            toast.warning("Please login from dropxcult-store to save designs to your account");
            return;
        }

        // If new design or default name, ask for name
        if (!currentDesignId || projectName === "tshirt-project" || projectName === "Untitled Design") {
            setCloudSaveName(projectName);
            setIsCloudSaveModalOpen(true);
        } else {
            saveToDatabase(projectName);
        }
    };

    const confirmCloudSave = () => {
        if (cloudSaveName.trim()) {
            setProjectName(cloudSaveName);
            setIsCloudSaveModalOpen(false);
            saveToDatabase(cloudSaveName);
        }
    };

    const saveToDatabase = async (nameOverride) => {
        setIsSaving(true);
        try {
            const canvas = fabricRef.current;
            const json = canvas.toJSON();

            // Convert blob URLs to data URLs for images (blob URLs expire)
            if (json.objects) {
                for (let i = 0; i < json.objects.length; i++) {
                    const obj = json.objects[i];
                    if (obj.type === 'image' && obj.src && obj.src.startsWith('blob:')) {
                        try {
                            // Fetch the blob and convert to base64
                            const response = await fetch(obj.src);
                            const blob = await response.blob();
                            const dataUrl = await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(blob);
                            });
                            json.objects[i].src = dataUrl;
                        } catch (e) {
                            console.warn('Could not convert blob URL, removing image:', e);
                            json.objects.splice(i, 1);
                            i--;
                        }
                    }
                }
            }

            // Generate preview image
            let previewImage;
            if (onGetSnapshot) {
                previewImage = onGetSnapshot();
            }
            if (!previewImage) {
                previewImage = canvas.toDataURL({
                    format: 'png',
                    quality: 0.8,
                    multiplier: 0.5
                });
            }

            const finalName = nameOverride || projectName || 'Untitled Design';

            // Map tshirtType to garmentType for size chart display
            const garmentType = (tshirtType === 'hoodie' || tshirtType === 'sweatshirt') ? 'Hoodie' : 'T-Shirt';

            const designData = {
                userId: currentUser.id,
                name: finalName,
                tshirtType: tshirtType,
                tshirtColor: tshirtColor,
                garmentType: garmentType, // For size chart in wishlist
                canvasState: json,
                previewImage: previewImage
            };

            const url = currentDesignId
                ? `/api/designs/${currentDesignId}`
                : '/api/designs';
            const method = currentDesignId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(designData)
            });

            if (!response.ok) throw new Error('Save failed');

            const savedDesign = await response.json();
            setCurrentDesignId(savedDesign.id);
            toast.success("Design saved to your account!");
        } catch (error) {
            console.error('Failed to save design:', error);
            toast.error("Failed to save design. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const saveProject = async () => {
        const blob = await generateZipBlob();
        if (!blob) return;

        try {
            if (fileHandle) {
                // Try to overwrite existing file
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                toast.success("Project saved successfully!");
            } else {
                throw new Error("No file handle");
            }
        } catch (error) {
            console.warn("Native save failed, falling back to download:", error);
            // Fallback to download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectName}.zip`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const saveAsProject = async () => {
        try {
            // Try Native File System API
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: `${projectName}.zip`,
                    types: [{
                        description: 'ZIP Archive',
                        accept: { 'application/zip': ['.zip'] },
                    }],
                });

                setFileHandle(handle);
                setProjectName(handle.name.replace('.zip', ''));

                const blob = await generateZipBlob();
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                toast.success("Project saved successfully!");
            } else {
                throw new Error("API not supported");
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn("Native save-as failed, falling back to modal:", error);
                // Fallback to modal
                setNewProjectName(projectName);
                setIsSaveAsModalOpen(true);
            }
        }
    };

    const confirmSaveAsModal = async () => {
        if (newProjectName.trim()) {
            setProjectName(newProjectName);
            const blob = await generateZipBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${newProjectName}.zip`;
            a.click();
            URL.revokeObjectURL(url);
            setIsSaveAsModalOpen(false);
            setFileHandle(null); // Reset handle since we downloaded a new file
        }
    };

    const loadDesignFromId = async (id, user = currentUser) => {
        try {
            const response = await fetch(`/api/designs/${id}`);
            if (!response.ok) throw new Error("Failed to fetch design");

            const design = await response.json();
            setCurrentDesignId(design.id);
            setProjectName(design.name);

            // Check if viewOnly is forced via URL
            const params = new URLSearchParams(window.location.search);
            const urlViewOnly = params.get('viewOnly') === 'true';

            // Check ownership - user must exist AND own the design AND not have viewOnly in URL
            const isOwner = user && design.userId === user.id && !urlViewOnly;

            console.log("Ownership check:", {
                userId: user?.id,
                designOwnerId: design.userId,
                urlViewOnly,
                isOwner
            });

            if (!isOwner && fabricRef.current) {
                // User doesn't own this design - disable all editing
                fabricRef.current.selection = false;
                fabricRef.current.forEachObject(obj => {
                    obj.selectable = false;
                    obj.evented = false;
                });
                console.log("View-only mode ENABLED: User doesn't own this design or viewOnly=true");
            }

            // Update T-shirt settings
            if (onLoad) {
                onLoad({
                    type: design.tshirtType,
                    color: design.tshirtColor
                });
            }

            // Wait for fabric to be ready
            if (fabricRef.current && design.canvasState) {
                // Filter out objects with expired blob URLs before loading
                const canvasData = typeof design.canvasState === 'string'
                    ? JSON.parse(design.canvasState)
                    : design.canvasState;

                if (canvasData.objects) {
                    // Remove objects with blob URLs (they expire and can't be reloaded)
                    canvasData.objects = canvasData.objects.filter(obj => {
                        if (obj.type === 'image' && obj.src && (obj.src.startsWith('blob:') || obj.src.includes('blob:'))) {
                            console.warn('Skipping image with expired blob URL:', obj.src);
                            return false;
                        }
                        return true;
                    });
                }

                try {
                    fabricRef.current.loadFromJSON(canvasData, () => {
                        // After loading, if not owner, disable all objects
                        if (!isOwner) {
                            fabricRef.current.selection = false;
                            fabricRef.current.forEachObject(obj => {
                                obj.selectable = false;
                                obj.evented = false;
                            });
                        }

                        fabricRef.current.renderAll();
                        updateTexture();

                        // Force re-render and offset calculation after load
                        setTimeout(() => {
                            if (fabricRef.current) {
                                fabricRef.current.requestRenderAll();
                                fabricRef.current.calcOffset();
                            }
                        }, 100);

                        console.log("Design loaded from database!" + (!isOwner ? " (View-only)" : ""));
                    });
                } catch (loadError) {
                    console.error("Error in loadFromJSON:", loadError);
                    // Clear canvas and show empty state
                    fabricRef.current.clear();
                    fabricRef.current.renderAll();
                    updateTexture();
                }
            }
        } catch (error) {
            console.error("Error loading design:", error);
            toast.error("Failed to load design from server.");
        }
    };

    const handleLoadClick = async () => {
        try {
            // Try Native File System API
            if ('showOpenFilePicker' in window) {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'Project Files',
                        accept: {
                            'application/zip': ['.zip'],
                            'application/json': ['.json']
                        },
                    }],
                    multiple: false
                });

                setFileHandle(handle);
                setProjectName(handle.name.replace(/\.(zip|json)$/, ''));

                const file = await handle.getFile();
                await loadProjectFile(file);
            } else {
                throw new Error("API not supported");
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn("Native load failed, falling back to input:", error);
                // Fallback to input
                document.getElementById('project-upload')?.click();
            }
        }
    };

    const loadProjectFile = async (file) => {
        if (!file || !fabricRef.current) return;

        try {
            if (file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const json = JSON.parse(event.target.result);
                    // Filter out expired blob URLs
                    if (json.objects) {
                        json.objects = json.objects.filter(obj => {
                            if (obj.type === 'image' && obj.src && obj.src.startsWith('blob:')) {
                                console.warn('Skipping image with expired blob URL');
                                return false;
                            }
                            return true;
                        });
                    }
                    fabricRef.current.loadFromJSON(json, () => {
                        fabricRef.current.renderAll();
                        updateTexture();
                    });
                };
                reader.readAsText(file);
            } else if (file.name.endsWith('.zip')) {
                const zip = new JSZip();
                const contents = await zip.loadAsync(file);

                const jsonFile = contents.file("design.json");
                if (!jsonFile) throw new Error("Invalid project file: design.json missing");

                // Try to load metadata
                const metadataFile = contents.file("metadata.json");
                if (metadataFile && onLoad) {
                    try {
                        const metadataStr = await metadataFile.async("text");
                        const metadata = JSON.parse(metadataStr);
                        if (metadata.type) {
                            onLoad(metadata);
                        }
                    } catch (e) {
                        console.warn("Failed to load metadata:", e);
                    }
                }

                const jsonStr = await jsonFile.async("text");
                const json = JSON.parse(jsonStr);

                const restoredObjects = await Promise.all(json.objects.map(async (obj) => {
                    if (obj.type === 'image' && obj.src && obj.src.startsWith('images/')) {
                        const imageFile = contents.file(obj.src);
                        if (imageFile) {
                            const blob = await imageFile.async("blob");
                            const url = URL.createObjectURL(blob);
                            return {
                                ...obj,
                                src: url,
                                crossOrigin: 'anonymous'
                            };
                        }
                    }
                    return obj;
                }));

                json.objects = restoredObjects;

                fabricRef.current.loadFromJSON(json, () => {
                    fabricRef.current.renderAll();
                    updateTexture();
                    setTimeout(() => {
                        if (fabricRef.current) {
                            fabricRef.current.requestRenderAll();
                            fabricRef.current.calcOffset();
                        }
                    }, 100);
                });
            }
        } catch (error) {
            console.error("Failed to load project:", error);
            toast.error("Failed to load project file");
        }
    };

    const exportHighRes = () => {
        if (fabricRef.current) {
            const dataURL = fabricRef.current.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 2
            });

            const a = document.createElement('a');
            a.href = dataURL;
            a.download = 'design_export.png';
            a.click();
        }
    };

    return (
        <div className="flex flex-col gap-4 items-center w-full h-full relative">
            <div className="w-full max-w-[min(80vh,700px)] aspect-square border-2 border-border rounded-lg relative overflow-hidden"
                style={{
                    backgroundImage: `url('${backgroundImage}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat"
                }}
            >
                <canvas
                    ref={canvasRef}
                    className="w-full h-full absolute top-0 left-0"
                />
            </div>

            {/* Text Editing Controls (Floating above bottom menu) */}
            {
                selectedObject?.type === 'i-text' && (
                    <div className="fixed bottom-28 sm:bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 backdrop-blur-md border border-gray-700 p-3 rounded-lg shadow-xl flex gap-4 items-center flex-wrap justify-center w-[90%] max-w-2xl">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-300">Color</label>
                            <input
                                type="color"
                                value={textColor}
                                onChange={(e) => {
                                    setTextColor(e.target.value);
                                    updateSelectedText('fill', e.target.value);
                                }}
                                className="h-8 w-8 rounded border-0 cursor-pointer"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-300">Size</label>
                            <Input
                                type="number"
                                value={fontSize}
                                onChange={(e) => {
                                    setFontSize(parseInt(e.target.value));
                                    updateSelectedText('fontSize', parseInt(e.target.value));
                                }}
                                className="w-16 h-8 bg-gray-800 border-gray-600 text-white text-xs"
                                min="10"
                                max="200"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Select
                                value={fontFamily}
                                onValueChange={(value) => {
                                    setFontFamily(value);
                                    updateSelectedText('fontFamily', value);
                                }}
                            >
                                <SelectTrigger className="w-28 h-8 bg-gray-800 border-gray-600 text-white text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {/* A-Z Alphabetical Order - Each font styled in its own typeface */}
                                    <SelectItem value="Algerian"><span style={{ fontFamily: 'Algerian' }}>Algerian</span></SelectItem>
                                    <SelectItem value="Arial"><span style={{ fontFamily: 'Arial' }}>Arial</span></SelectItem>
                                    <SelectItem value="Arial Black"><span style={{ fontFamily: 'Arial Black' }}>Arial Black</span></SelectItem>
                                    <SelectItem value="Baskerville"><span style={{ fontFamily: 'Baskerville' }}>Baskerville</span></SelectItem>
                                    <SelectItem value="Bauhaus 93"><span style={{ fontFamily: 'Bauhaus 93' }}>Bauhaus 93</span></SelectItem>
                                    <SelectItem value="Book Antiqua"><span style={{ fontFamily: 'Book Antiqua' }}>Book Antiqua</span></SelectItem>
                                    <SelectItem value="Bradley Hand ITC"><span style={{ fontFamily: 'Bradley Hand ITC' }}>Bradley Hand</span></SelectItem>
                                    <SelectItem value="Broadway"><span style={{ fontFamily: 'Broadway' }}>Broadway</span></SelectItem>
                                    <SelectItem value="Brush Script MT"><span style={{ fontFamily: 'Brush Script MT' }}>Brush Script</span></SelectItem>
                                    <SelectItem value="Calibri"><span style={{ fontFamily: 'Calibri' }}>Calibri</span></SelectItem>
                                    <SelectItem value="Cambria"><span style={{ fontFamily: 'Cambria' }}>Cambria</span></SelectItem>
                                    <SelectItem value="Candara"><span style={{ fontFamily: 'Candara' }}>Candara</span></SelectItem>
                                    <SelectItem value="Century Gothic"><span style={{ fontFamily: 'Century Gothic' }}>Century Gothic</span></SelectItem>
                                    <SelectItem value="Chiller"><span style={{ fontFamily: 'Chiller' }}>Chiller</span></SelectItem>
                                    <SelectItem value="Comic Sans MS"><span style={{ fontFamily: 'Comic Sans MS' }}>Comic Sans</span></SelectItem>
                                    <SelectItem value="Consolas"><span style={{ fontFamily: 'Consolas' }}>Consolas</span></SelectItem>
                                    <SelectItem value="Copperplate"><span style={{ fontFamily: 'Copperplate' }}>Copperplate</span></SelectItem>
                                    <SelectItem value="Courier New"><span style={{ fontFamily: 'Courier New' }}>Courier New</span></SelectItem>
                                    <SelectItem value="Didot"><span style={{ fontFamily: 'Didot' }}>Didot</span></SelectItem>
                                    <SelectItem value="Edwardian Script ITC"><span style={{ fontFamily: 'Edwardian Script ITC' }}>Edwardian Script</span></SelectItem>
                                    <SelectItem value="Franklin Gothic Medium"><span style={{ fontFamily: 'Franklin Gothic Medium' }}>Franklin Gothic</span></SelectItem>
                                    <SelectItem value="Freestyle Script"><span style={{ fontFamily: 'Freestyle Script' }}>Freestyle Script</span></SelectItem>
                                    <SelectItem value="French Script MT"><span style={{ fontFamily: 'French Script MT' }}>French Script</span></SelectItem>
                                    <SelectItem value="Futura"><span style={{ fontFamily: 'Futura' }}>Futura</span></SelectItem>
                                    <SelectItem value="Garamond"><span style={{ fontFamily: 'Garamond' }}>Garamond</span></SelectItem>
                                    <SelectItem value="Georgia"><span style={{ fontFamily: 'Georgia' }}>Georgia</span></SelectItem>
                                    <SelectItem value="Gill Sans"><span style={{ fontFamily: 'Gill Sans' }}>Gill Sans</span></SelectItem>
                                    <SelectItem value="Harrington"><span style={{ fontFamily: 'Harrington' }}>Harrington</span></SelectItem>
                                    <SelectItem value="Helvetica"><span style={{ fontFamily: 'Helvetica' }}>Helvetica</span></SelectItem>
                                    <SelectItem value="Impact"><span style={{ fontFamily: 'Impact' }}>Impact</span></SelectItem>
                                    <SelectItem value="Jokerman"><span style={{ fontFamily: 'Jokerman' }}>Jokerman</span></SelectItem>
                                    <SelectItem value="Kunstler Script"><span style={{ fontFamily: 'Kunstler Script' }}>Kunstler Script</span></SelectItem>
                                    <SelectItem value="Lucida Calligraphy"><span style={{ fontFamily: 'Lucida Calligraphy' }}>Lucida Calligraphy</span></SelectItem>
                                    <SelectItem value="Lucida Console"><span style={{ fontFamily: 'Lucida Console' }}>Lucida Console</span></SelectItem>
                                    <SelectItem value="Lucida Handwriting"><span style={{ fontFamily: 'Lucida Handwriting' }}>Lucida Handwriting</span></SelectItem>
                                    <SelectItem value="Lucida Sans"><span style={{ fontFamily: 'Lucida Sans' }}>Lucida Sans</span></SelectItem>
                                    <SelectItem value="Menlo"><span style={{ fontFamily: 'Menlo' }}>Menlo</span></SelectItem>
                                    <SelectItem value="Mistral"><span style={{ fontFamily: 'Mistral' }}>Mistral</span></SelectItem>
                                    <SelectItem value="Monaco"><span style={{ fontFamily: 'Monaco' }}>Monaco</span></SelectItem>
                                    <SelectItem value="Monotype Corsiva"><span style={{ fontFamily: 'Monotype Corsiva' }}>Monotype Corsiva</span></SelectItem>
                                    <SelectItem value="Optima"><span style={{ fontFamily: 'Optima' }}>Optima</span></SelectItem>
                                    <SelectItem value="Palace Script MT"><span style={{ fontFamily: 'Palace Script MT' }}>Palace Script</span></SelectItem>
                                    <SelectItem value="Palatino Linotype"><span style={{ fontFamily: 'Palatino Linotype' }}>Palatino</span></SelectItem>
                                    <SelectItem value="Papyrus"><span style={{ fontFamily: 'Papyrus' }}>Papyrus</span></SelectItem>
                                    <SelectItem value="Playbill"><span style={{ fontFamily: 'Playbill' }}>Playbill</span></SelectItem>
                                    <SelectItem value="Rage Italic"><span style={{ fontFamily: 'Rage Italic' }}>Rage Italic</span></SelectItem>
                                    <SelectItem value="Ravie"><span style={{ fontFamily: 'Ravie' }}>Ravie</span></SelectItem>
                                    <SelectItem value="Rockwell"><span style={{ fontFamily: 'Rockwell' }}>Rockwell</span></SelectItem>
                                    <SelectItem value="Script MT Bold"><span style={{ fontFamily: 'Script MT Bold' }}>Script MT Bold</span></SelectItem>
                                    <SelectItem value="Segoe Script"><span style={{ fontFamily: 'Segoe Script' }}>Segoe Script</span></SelectItem>
                                    <SelectItem value="Segoe UI"><span style={{ fontFamily: 'Segoe UI' }}>Segoe UI</span></SelectItem>
                                    <SelectItem value="Showcard Gothic"><span style={{ fontFamily: 'Showcard Gothic' }}>Showcard Gothic</span></SelectItem>
                                    <SelectItem value="Snell Roundhand"><span style={{ fontFamily: 'Snell Roundhand' }}>Snell Roundhand</span></SelectItem>
                                    <SelectItem value="Stencil"><span style={{ fontFamily: 'Stencil' }}>Stencil</span></SelectItem>
                                    <SelectItem value="Tahoma"><span style={{ fontFamily: 'Tahoma' }}>Tahoma</span></SelectItem>
                                    <SelectItem value="Times New Roman"><span style={{ fontFamily: 'Times New Roman' }}>Times New Roman</span></SelectItem>
                                    <SelectItem value="Trebuchet MS"><span style={{ fontFamily: 'Trebuchet MS' }}>Trebuchet MS</span></SelectItem>
                                    <SelectItem value="Verdana"><span style={{ fontFamily: 'Verdana' }}>Verdana</span></SelectItem>
                                    <SelectItem value="Vivaldi"><span style={{ fontFamily: 'Vivaldi' }}>Vivaldi</span></SelectItem>
                                    <SelectItem value="Vladimir Script"><span style={{ fontFamily: 'Vladimir Script' }}>Vladimir Script</span></SelectItem>
                                    <SelectItem value="Zapfino"><span style={{ fontFamily: 'Zapfino' }}>Zapfino</span></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>


                        <Button onClick={deleteSelected} variant="destructive" size="sm" className="h-8 px-2">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )
            }

            {/* Main Bottom Menu */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 p-2 sm:p-4 pb-4 sm:pb-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-1 sm:gap-4 px-1 sm:px-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                    <input
                        id="project-upload"
                        type="file"
                        accept=".json,.zip"
                        onChange={(e) => loadProjectFile(e.target.files[0])}
                        className="hidden"
                    />

                    {/* Tools Group */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="ghost"
                            className="flex flex-col items-center gap-0.5 sm:gap-1.5 h-auto py-1.5 px-2 sm:py-2 sm:px-4 text-gray-400 hover:text-white hover:bg-white/10 transition-all rounded-xl"
                        >
                            <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wide">Upload</span>
                        </Button>

                        <Button
                            onClick={addText}
                            variant="ghost"
                            className="flex flex-col items-center gap-0.5 sm:gap-1.5 h-auto py-1.5 px-2 sm:py-2 sm:px-4 text-gray-400 hover:text-white hover:bg-white/10 transition-all rounded-xl"
                        >
                            <Type className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wide">Text</span>
                        </Button>

                        <Button
                            onClick={rotateLeft}
                            variant="ghost"
                            className="flex flex-col items-center gap-0.5 sm:gap-1.5 h-auto py-1.5 px-2 sm:py-2 sm:px-4 text-gray-400 hover:text-white hover:bg-white/10 transition-all rounded-xl"
                            title="Rotate Left 15°"
                        >
                            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wide">↺</span>
                        </Button>

                        <Button
                            onClick={rotateRight}
                            variant="ghost"
                            className="flex flex-col items-center gap-0.5 sm:gap-1.5 h-auto py-1.5 px-2 sm:py-2 sm:px-4 text-gray-400 hover:text-white hover:bg-white/10 transition-all rounded-xl"
                            title="Rotate Right 15°"
                        >
                            <RotateCw className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wide">↻</span>
                        </Button>

                        {/* Remove Background Button */}
                        <Button
                            onClick={removeImageBg}
                            disabled={isRemovingBg}
                            variant="ghost"
                            className={`flex flex-col items-center gap-0.5 sm:gap-1.5 h-auto py-1.5 px-2 sm:py-2 sm:px-4 transition-all rounded-xl ${isRemovingBg ? 'text-purple-400 animate-pulse' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                            title="Remove Background from Image"
                        >
                            {isRemovingBg ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <Wand2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                            <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wide">{isRemovingBg ? 'Wait...' : 'Rm BG'}</span>
                        </Button>

                        {/* Delete Selected Button */}
                        <Button
                            onClick={deleteSelected}
                            variant="ghost"
                            className="flex flex-col items-center gap-0.5 sm:gap-1.5 h-auto py-1.5 px-2 sm:py-2 sm:px-4 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-xl"
                            title="Delete Selected"
                        >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wide">Delete</span>
                        </Button>
                    </div>

                    <div className="h-8 sm:h-10 w-px bg-white/10 mx-0.5 sm:mx-2" />

                    {/* Project Actions Group */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                        <Button
                            onClick={initiateSave}
                            disabled={isSaving || !currentUser}
                            variant="ghost"
                            className={`flex flex-col items-center gap-0.5 sm:gap-1.5 h-auto py-1.5 px-2 sm:py-2 sm:px-4 transition-all rounded-xl ${currentUser
                                ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
                                : 'text-gray-600 cursor-not-allowed'
                                }`}
                            title={currentUser ? "Save to Cloud" : "Login required"}
                        >
                            <span className="text-xl sm:text-2xl mb-[-2px]">{isSaving ? '...' : '☁️'}</span>
                            <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wide">
                                {isSaving ? 'Saving...' : 'Save'}
                            </span>
                        </Button>

                        {/* Export/Download Button - Admin Only */}
                        {currentUser?.isAdmin && (
                            <Button
                                onClick={exportHighRes}
                                variant="ghost"
                                className="flex flex-col items-center gap-0.5 sm:gap-1.5 h-auto py-1.5 px-2 sm:py-2 sm:px-4 text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-all rounded-xl"
                                title="Export Design as PNG"
                            >
                                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wide">Export</span>
                            </Button>
                        )}
                    </div>

                    {/* Divider - Hidden on mobile */}
                    <div className="hidden md:block h-10 w-px bg-white/10 mx-2" />

                    {/* View Controls - Hidden on mobile */}
                    <div className="hidden md:flex items-center gap-1">
                        <Button
                            onClick={zoomOut}
                            variant="ghost"
                            className="flex flex-col items-center gap-1.5 h-auto py-2 px-4 text-gray-400 hover:text-white hover:bg-white/10 transition-all rounded-xl"
                        >
                            <ZoomOut className="h-5 w-5" />
                            <span className="text-[10px] font-medium uppercase tracking-wide">Zoom -</span>
                        </Button>
                        <Button
                            onClick={zoomIn}
                            variant="ghost"
                            className="flex flex-col items-center gap-1.5 h-auto py-2 px-4 text-gray-400 hover:text-white hover:bg-white/10 transition-all rounded-xl"
                        >
                            <ZoomIn className="h-5 w-5" />
                            <span className="text-[10px] font-medium uppercase tracking-wide">Zoom +</span>
                        </Button>
                    </div>

                    {/* Primary Action - Admin Only */}
                    {currentUser?.isAdmin && (
                        <div className="ml-auto pl-1 sm:pl-4 border-l border-white/10">
                            <Button
                                onClick={exportHighRes}
                                className="bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/5 h-auto py-2 px-3 sm:py-3 sm:px-6 rounded-xl flex flex-col items-center gap-0.5 sm:gap-1"
                            >
                                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide">Export</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Cloud Save Modal */}
            {isCloudSaveModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background border border-border p-6 rounded-lg shadow-lg w-80">
                        <h3 className="text-lg font-semibold mb-4">Name your Design</h3>
                        <Input
                            value={cloudSaveName}
                            onChange={(e) => setCloudSaveName(e.target.value)}
                            placeholder="Design Name (e.g. My Cool Shirt)"
                            className="mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsCloudSaveModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={confirmCloudSave}>
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save As Modal (Fallback) */}
            {isSaveAsModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background border border-border p-6 rounded-lg shadow-lg w-80">
                        <h3 className="text-lg font-semibold mb-4">Save Project As</h3>
                        <Input
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Project Name"
                            className="mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsSaveAsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={confirmSaveAsModal}>
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
