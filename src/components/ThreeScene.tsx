import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useDiagramState } from '@hooks/useDiagramState';
import { parseMermaidDiagram, GraphData, calculateOptimalCamera, GraphNode, GraphEdge } from '@utils/mermaidParser';
import { colors } from '@theme/colors';
import '../styles/three-scene.css';

interface ThreeSceneProps {
  className?: string;
}

export default function ThreeScene({ className }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationRef = useRef<number | null>(null);
  const graphObjectsRef = useRef<{ nodes: THREE.Group[], edges: THREE.Line[] }>({ nodes: [], edges: [] });
  
  const { currentDiagram, canRender } = useDiagramState();
  const { isValidating, content } = currentDiagram;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Three.js scene
  const initializeScene = useCallback(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(colors.dark.bg);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 10);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    rendererRef.current = renderer;

    // Add lights
    addLights(scene);

    // Create controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 100;
    controls.minDistance = 1;
    controlsRef.current = controls;

    // Add renderer to DOM
    containerRef.current.appendChild(renderer.domElement);

    // Start render loop
    startRenderLoop();
  }, []);

  // Add lights to scene
  const addLights = (scene: THREE.Scene) => {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Fill lights with theme colors
    const neonCyan = new THREE.DirectionalLight(0x00f5ff, 0.5);
    neonCyan.position.set(-10, 0, 10);
    scene.add(neonCyan);

    const neonPurple = new THREE.DirectionalLight(0xb537f2, 0.3);
    neonPurple.position.set(0, -10, -5);
    scene.add(neonPurple);
  };

  // Start render loop
  const startRenderLoop = useCallback(() => {
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      // Update controls
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Render scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();
  }, []);

  // Clear existing graph objects
  const clearGraphObjects = useCallback(() => {
    if (!sceneRef.current) return;

    // Remove existing nodes (which are now groups)
    graphObjectsRef.current.nodes.forEach(nodeGroup => {
      sceneRef.current!.remove(nodeGroup);
      
      // Dispose all geometries and materials in the group
      nodeGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        } else if (child instanceof THREE.Sprite) {
          if (child.material.map) {
            child.material.map.dispose();
          }
          child.material.dispose();
        }
      });
    });

    // Remove existing edges
    graphObjectsRef.current.edges.forEach(edge => {
      sceneRef.current!.remove(edge);
      edge.geometry.dispose();
      if (Array.isArray(edge.material)) {
        edge.material.forEach(mat => mat.dispose());
      } else {
        edge.material.dispose();
      }
    });

    graphObjectsRef.current = { nodes: [], edges: [] };
  }, []);

  // Create text label
  const createTextLabel = useCallback((text: string, position: THREE.Vector3, color: string = colors.white) => {
    // Create canvas for text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;
    
    // Set canvas size
    canvas.width = 256;
    canvas.height = 64;
    
    // Configure text rendering
    context.fillStyle = color;
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Add text shadow for better visibility
    context.shadowColor = 'rgba(0, 0, 0, 0.8)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    
    // Draw text
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create sprite material
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    
    // Create sprite
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.z += 1.5; // Place label above the node
    sprite.scale.set(4, 1, 1); // Adjust size
    
    return sprite;
  }, []);

  // Create node mesh
  const createNodeMesh = useCallback((node: GraphNode) => {
    // Create geometry based on node type
    let geometry: THREE.BufferGeometry;
    
    switch (node.type) {
      case 'circle':
        geometry = new THREE.SphereGeometry(0.5, 16, 16);
        break;
      case 'diamond':
        geometry = new THREE.OctahedronGeometry(0.7);
        break;
      default: // rect
        geometry = new THREE.BoxGeometry(Math.min(node.width || 2, 3), Math.min(node.height || 1, 1.5), 1);
    }

    // Create material with neon colors
    const material = new THREE.MeshPhongMaterial({
      color: node.color || colors.neon.pink,
      emissive: node.color || colors.neon.pink,
      emissiveIntensity: 0.3,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(node.x, node.y, node.z || 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { node };

    // Add glow effect with a slightly larger mesh
    const glowGeometry = geometry.clone();
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: node.color || colors.neon.pink,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(mesh.position);
    glowMesh.scale.multiplyScalar(1.2);
    
    // Group node and glow
    const nodeGroup = new THREE.Group();
    nodeGroup.add(glowMesh);
    nodeGroup.add(mesh);
    
    // Add text label
    const textLabel = createTextLabel(node.label, new THREE.Vector3(node.x, node.y, node.z || 0), colors.white);
    if (textLabel) {
      nodeGroup.add(textLabel);
    }

    return nodeGroup;
  }, [createTextLabel]);

  // Create edge line
  const createEdgeLine = useCallback((edge: GraphEdge, nodes: GraphNode[]) => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);

    if (!fromNode || !toNode) return null;

    // Create line geometry
    const points = [
      new THREE.Vector3(fromNode.x, fromNode.y, fromNode.z || 0),
      new THREE.Vector3(toNode.x, toNode.y, toNode.z || 0)
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create neon-style line material
    const material = new THREE.LineBasicMaterial({
      color: colors.neon.cyan,
      linewidth: 3,
      transparent: true,
      opacity: 0.8
    });

    const line = new THREE.Line(geometry, material);
    line.userData = { edge };
    
    return line;
  }, []);

  // Render graph
  const renderGraph = useCallback(async (graphData: GraphData) => {
    if (!sceneRef.current || graphData.nodes.length === 0) {
      clearGraphObjects();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      clearGraphObjects();

      // Create and add nodes
      const nodeGroups: THREE.Group[] = [];
      for (const nodeData of graphData.nodes) {
        const nodeGroup = createNodeMesh(nodeData);
        if (nodeGroup) {
          sceneRef.current!.add(nodeGroup);
          nodeGroups.push(nodeGroup);
        }
      }

      // Create and add edges
      const edgeLines: THREE.Line[] = [];
      for (const edgeData of graphData.edges) {
        const edgeLine = createEdgeLine(edgeData, graphData.nodes);
        if (edgeLine) {
          sceneRef.current!.add(edgeLine);
          edgeLines.push(edgeLine);
        }
      }

      graphObjectsRef.current = {
        nodes: nodeGroups,
        edges: edgeLines
      };

      // Calculate and set optimal camera position
      const cameraSettings = calculateOptimalCamera(graphData);
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(
          cameraSettings.position.x,
          cameraSettings.position.y,
          cameraSettings.position.z
        );
        controlsRef.current.target.set(
          cameraSettings.target.x,
          cameraSettings.target.y,
          cameraSettings.target.z
        );
        controlsRef.current.update();
      }

    } catch (err) {
      console.error('Error rendering graph:', err);
      setError(err instanceof Error ? err.message : 'Failed to render graph');
    } finally {
      setIsLoading(false);
    }
  }, [clearGraphObjects, createNodeMesh, createEdgeLine]);

  // Handle content changes
  useEffect(() => {
    if (!canRender || !content) {
      clearGraphObjects();
      return;
    }

    const updateGraph = async () => {
      try {
        const graphData = await parseMermaidDiagram(content);
        await renderGraph(graphData);
      } catch (err) {
        console.error('Error parsing diagram:', err);
        setError('Failed to parse diagram');
      }
    };

    updateGraph();
  }, [content, canRender, renderGraph, clearGraphObjects]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, []);

  // Setup resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [handleResize]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      clearGraphObjects();

      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, [clearGraphObjects]);

  // Initialize scene on mount
  useEffect(() => {
    if (containerRef.current && !sceneRef.current) {
      initializeScene();
    }
  }, [initializeScene]);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className || ''}`}>
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ background: `linear-gradient(135deg, ${colors.dark.bg} 0%, #1a1f3a 100%)` }}
      />

      {/* Status overlay */}
      {(isValidating || isLoading || error || !canRender) && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/80 backdrop-blur-sm">
          <div className="text-center">
            {isValidating || isLoading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                <p className="text-cyan-400 font-medium">
                  {isValidating ? 'Validating diagram...' : 'Rendering 3D scene...'}
                </p>
              </>
            ) : error ? (
              <>
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-red-500/20 rounded-full">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-red-400 font-medium mb-2">3D Render Error</p>
                <p className="text-gray-400 text-sm">{error}</p>
              </>
            ) : !canRender ? (
              <>
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-yellow-500/20 rounded-full">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-yellow-400 font-medium mb-2">Invalid Diagram</p>
                <p className="text-gray-400 text-sm">Fix syntax errors to render 3D scene</p>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Controls hint */}
      {canRender && !isLoading && !error && (
        <div className="absolute top-4 left-4 bg-dark-surface/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-dark-border">
          <p className="text-xs text-gray-400">
            <span className="text-cyan-400">Mouse:</span> Rotate • <span className="text-cyan-400">Scroll:</span> Zoom • <span className="text-cyan-400">Drag:</span> Pan
          </p>
        </div>
      )}
    </div>
  );
}