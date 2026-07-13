import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Color } from '../types';
import { Rotate3d, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface STLViewerProps {
  positions: Float32Array;
  colorHex: string;
  finishType: Color['type'];
  className?: string;
}

export default function STLViewer({ positions, colorHex, finishType, className = '' }: STLViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isRotating, setIsRotating] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  // Refs for animation and interaction states
  const meshRef = useRef<THREE.Mesh | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const targetRotation = useRef({ x: -0.3, y: 0.5 });
  const currentRotation = useRef({ x: -0.3, y: 0.5 });
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const zoomLevel = useRef(2.2);

  // Auto-rotate effect
  useEffect(() => {
    let animationFrameId: number;
    
    const render = () => {
      if (groupRef.current) {
        if (isRotating && !isDragging.current) {
          targetRotation.current.y += 0.005;
        }
        
        // Smooth interpolation (lerp) for inertia
        currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.15;
        currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.15;
        
        groupRef.current.rotation.x = currentRotation.current.x;
        groupRef.current.rotation.y = currentRotation.current.y;
      }
      
      if (rendererRef.current && cameraRef.current) {
        const scene = rendererRef.current.metadata?.scene as THREE.Scene | undefined;
        if (scene) {
          rendererRef.current.render(scene, cameraRef.current);
        }
      }
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    animationFrameId = requestAnimationFrame(render);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRotating]);

  // Update material properties on change
  useEffect(() => {
    if (!meshRef.current) return;
    
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    material.color.set(colorHex);
    
    // Adjust appearance based on the printing material finish
    switch (finishType) {
      case 'mate':
        material.roughness = 0.85;
        material.metalness = 0.05;
        break;
      case 'brillante':
        material.roughness = 0.12;
        material.metalness = 0.15;
        break;
      case 'seda':
        material.roughness = 0.22;
        material.metalness = 0.45;
        break;
      case 'metalico':
        material.roughness = 0.28;
        material.metalness = 0.85;
        break;
      default:
        material.roughness = 0.5;
        material.metalness = 0.1;
    }
    
    material.needsUpdate = true;
  }, [colorHex, finishType]);

  // Main ThreeJS Setup
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    
    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 400;
    
    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a'); // slate-900 matching the premium theme
    
    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    
    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Stash scene reference in renderer metadata to let animation loop use it
    (renderer as any).metadata = { scene };
    rendererRef.current = renderer;
    
    // 4. Lights
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.5);
    scene.add(ambientLight);
    
    const dirLight1 = new THREE.DirectionalLight('#ffffff', 0.8);
    dirLight1.position.set(100, 150, 50);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    scene.add(dirLight1);
    
    const dirLight2 = new THREE.DirectionalLight('#38bdf8', 0.4); // Subtle cyan fill light
    dirLight2.position.set(-100, -50, -50);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight('#ffffff', 0.3);
    pointLight.position.set(0, 100, 100);
    scene.add(pointLight);
    
    // 5. Interactive Group
    const renderGroup = new THREE.Group();
    scene.add(renderGroup);
    groupRef.current = renderGroup;
    
    // 6. Build Plate Representation (Bambu Lab standard 256x256mm)
    const plateSize = 256;
    const gridHelper = new THREE.GridHelper(plateSize, 32, '#38bdf8', '#334155');
    // Position grid slightly below origin
    gridHelper.position.y = -1;
    // Add a circular boundary for a nice build plate look
    const circleGeometry = new THREE.RingGeometry(plateSize / 2, (plateSize / 2) + 2, 64);
    const circleMaterial = new THREE.MeshBasicMaterial({ color: '#1e293b', side: THREE.DoubleSide });
    const buildRing = new THREE.Mesh(circleGeometry, circleMaterial);
    buildRing.rotation.x = Math.PI / 2;
    buildRing.position.y = -1.1;
    scene.add(gridHelper);
    scene.add(buildRing);
    
    // 7. Load Mesh Data
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    
    // Center geometry to origin
    geometry.center();
    
    // Create material with current config
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Position mesh slightly above grid helper base
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    if (bbox) {
      const minHeight = bbox.min.y;
      mesh.position.y = -minHeight; // Offset so bottom sits exactly on the plate
    }
    
    renderGroup.add(mesh);
    meshRef.current = mesh;
    
    // 8. Focus Camera
    geometry.computeBoundingSphere();
    const radius = geometry.boundingSphere?.radius || 50;
    const modelCenter = geometry.boundingSphere?.center || new THREE.Vector3();
    
    // Position camera based on geometry size
    const distance = radius * zoomLevel.current;
    camera.position.set(0, radius * 1.0, Math.max(distance, 60));
    camera.lookAt(0, radius * 0.4, 0);
    
    setIsReady(true);
    
    // 9. Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(w, h);
    };
    
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [positions]);

  // Handle Drag / Pointer Events manually for simple Orbit-like Rotation
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;
    
    // Adjust target rotation based on movement
    targetRotation.current.y += deltaX * 0.01;
    targetRotation.current.x += deltaY * 0.01;
    
    // Constraint X rotation to avoid flipping upside down
    targetRotation.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 10, targetRotation.current.x));
    
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  // Wheel Zoom Handler
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!cameraRef.current || !meshRef.current) return;
    e.preventDefault();
    
    const geometry = meshRef.current.geometry;
    geometry.computeBoundingSphere();
    const radius = geometry.boundingSphere?.radius || 50;
    
    // Adjust zoomLevel factor
    const zoomFactor = e.deltaY * 0.001;
    zoomLevel.current = Math.max(1.0, Math.min(5.0, zoomLevel.current + zoomFactor));
    
    const distance = radius * zoomLevel.current;
    
    // Adjust only distance, maintain camera height proportion
    cameraRef.current.position.z = Math.max(distance, 15);
    cameraRef.current.position.y = radius * (zoomLevel.current * 0.45);
  };

  const handleZoom = (inDirection: boolean) => {
    if (!cameraRef.current || !meshRef.current) return;
    const geometry = meshRef.current.geometry;
    geometry.computeBoundingSphere();
    const radius = geometry.boundingSphere?.radius || 50;
    
    const zoomFactor = inDirection ? -0.3 : 0.3;
    zoomLevel.current = Math.max(1.0, Math.min(5.0, zoomLevel.current + zoomFactor));
    
    const distance = radius * zoomLevel.current;
    cameraRef.current.position.z = Math.max(distance, 15);
    cameraRef.current.position.y = radius * (zoomLevel.current * 0.45);
  };

  const resetView = () => {
    targetRotation.current = { x: -0.3, y: 0.5 };
    zoomLevel.current = 2.2;
    if (cameraRef.current && meshRef.current) {
      const geometry = meshRef.current.geometry;
      geometry.computeBoundingSphere();
      const radius = geometry.boundingSphere?.radius || 50;
      cameraRef.current.position.set(0, radius * 1.0, radius * zoomLevel.current);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 ${className}`}
      id="3d-stl-viewer-container"
    >
      <canvas 
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        id="3d-stl-canvas"
      />
      
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-slate-400">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">Renderizando modelo 3D...</p>
        </div>
      )}
      
      {/* Viewer controls Overlay */}
      {isReady && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur border border-slate-800 shadow-xl text-slate-300">
          <button 
            type="button"
            id="viewer-btn-rotate"
            onClick={() => setIsRotating(!isRotating)}
            className={`p-1.5 rounded-lg transition-colors hover:text-sky-400 hover:bg-slate-800 ${isRotating ? 'text-sky-400 bg-sky-500/10' : ''}`}
            title={isRotating ? 'Pausar rotación automática' : 'Activar rotación automática'}
          >
            <Rotate3d className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>
          
          <div className="w-[1px] h-4 bg-slate-800 mx-1"></div>
          
          <button 
            type="button"
            id="viewer-btn-zoomin"
            onClick={() => handleZoom(true)}
            className="p-1.5 rounded-lg transition-colors hover:text-sky-400 hover:bg-slate-800"
            title="Acercar (Girar rueda mouse)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <button 
            type="button"
            id="viewer-btn-zoomout"
            onClick={() => handleZoom(false)}
            className="p-1.5 rounded-lg transition-colors hover:text-sky-400 hover:bg-slate-800"
            title="Alejar (Girar rueda mouse)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button 
            type="button"
            id="viewer-btn-reset"
            onClick={resetView}
            className="p-1.5 rounded-lg transition-colors hover:text-sky-400 hover:bg-slate-800"
            title="Restablecer cámara"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Help Overlay text */}
      <div className="absolute top-3 left-3 pointer-events-none text-[10px] text-slate-400 bg-slate-950/60 backdrop-blur border border-slate-800/40 px-2 py-1 rounded">
        Arrastra para rotar • Rueda para zoom
      </div>
    </div>
  );
}
