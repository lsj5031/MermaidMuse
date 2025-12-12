import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useDiagramState } from '@hooks/useDiagramState';
import {
  parseMermaidDiagram,
  type GraphData,
  calculateOptimalCamera,
  type GraphNode,
  type GraphEdge,
} from '@utils/mermaidParser';
import { DIAGRAM_THEME_CONFIG, type ThreePalette } from '@theme/diagramThemes';
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

  const graphObjectsRef = useRef<{ nodes: THREE.Group[]; edges: THREE.Line[] }>({ nodes: [], edges: [] });
  const lightsGroupRef = useRef<THREE.Group | null>(null);

  const { currentDiagram, canRender, theme } = useDiagramState();
  const { isValidating, content, type } = currentDiagram;

  const palette = useMemo(() => DIAGRAM_THEME_CONFIG[theme].three, [theme]);
  const labelColor = theme === 'light' ? '#0f172a' : colors.white;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only render 3D for graph and flowchart diagrams
  const supports3D = type === 'flowchart' || content.includes('graph');
  const canRender3D = canRender && supports3D;

  const startRenderLoop = useCallback(() => {
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();
  }, []);

  const addLights = useCallback((scene: THREE.Scene, themePalette: ThreePalette) => {
    if (lightsGroupRef.current) {
      scene.remove(lightsGroupRef.current);
      lightsGroupRef.current = null;
    }

    const group = new THREE.Group();

    const ambientLight = new THREE.AmbientLight(
      themePalette.ambientLight.color,
      themePalette.ambientLight.intensity
    );
    group.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(
      themePalette.keyLight.color,
      themePalette.keyLight.intensity
    );
    directionalLight.position.set(...themePalette.keyLight.position);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    group.add(directionalLight);

    const accent1 = new THREE.DirectionalLight(
      themePalette.accentLight1.color,
      themePalette.accentLight1.intensity
    );
    accent1.position.set(...themePalette.accentLight1.position);
    group.add(accent1);

    const accent2 = new THREE.DirectionalLight(
      themePalette.accentLight2.color,
      themePalette.accentLight2.intensity
    );
    accent2.position.set(...themePalette.accentLight2.position);
    group.add(accent2);

    scene.add(group);
    lightsGroupRef.current = group;
  }, []);

  const initializeScene = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(palette.background);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    rendererRef.current = renderer;

    addLights(scene, palette);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 100;
    controls.minDistance = 1;
    controlsRef.current = controls;

    container.appendChild(renderer.domElement);
    startRenderLoop();
  }, [addLights, palette, startRenderLoop]);

  const clearGraphObjects = useCallback(() => {
    if (!sceneRef.current) return;

    graphObjectsRef.current.nodes.forEach((nodeGroup) => {
      sceneRef.current!.remove(nodeGroup);

      nodeGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
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

    graphObjectsRef.current.edges.forEach((edge) => {
      sceneRef.current!.remove(edge);
      edge.geometry.dispose();
      if (Array.isArray(edge.material)) {
        edge.material.forEach((mat) => mat.dispose());
      } else {
        edge.material.dispose();
      }
    });

    graphObjectsRef.current = { nodes: [], edges: [] };
  }, []);

  const createTextLabel = useCallback(
    (text: string, position: THREE.Vector3, color: string = colors.white) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return null;

      canvas.width = 256;
      canvas.height = 64;

      context.fillStyle = color;
      context.font = '24px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';

      context.shadowColor = 'rgba(0, 0, 0, 0.8)';
      context.shadowBlur = 4;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;

      context.fillText(text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      const material = new THREE.SpriteMaterial({ map: texture, transparent: true });

      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.position.z += 1.5;
      sprite.scale.set(4, 1, 1);

      return sprite;
    },
    []
  );

  const createNodeMesh = useCallback(
    (node: GraphNode) => {
      let geometry: THREE.BufferGeometry;

      switch (node.type) {
        case 'circle':
          geometry = new THREE.SphereGeometry(0.5, 16, 16);
          break;
        case 'diamond':
          geometry = new THREE.OctahedronGeometry(0.7);
          break;
        default:
          geometry = new THREE.BoxGeometry(Math.min(node.width || 2, 3), Math.min(node.height || 1, 1.5), 1);
      }

      const baseColor = node.color || colors.neon.pink;

      const material = new THREE.MeshPhongMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: 0.3,
        shininess: 100,
        transparent: true,
        opacity: 0.9,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(node.x, node.y, node.z || 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { node };

      const glowGeometry = geometry.clone();
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide,
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.copy(mesh.position);
      glowMesh.scale.multiplyScalar(1.2);

      const nodeGroup = new THREE.Group();
      nodeGroup.add(glowMesh);
      nodeGroup.add(mesh);

      const textLabel = createTextLabel(node.label, new THREE.Vector3(node.x, node.y, node.z || 0), labelColor);
      if (textLabel) {
        nodeGroup.add(textLabel);
      }

      return nodeGroup;
    },
    [createTextLabel, labelColor]
  );

  const createEdgeLine = useCallback(
    (edge: GraphEdge, nodes: GraphNode[]) => {
      const fromNode = nodes.find((n) => n.id === edge.from);
      const toNode = nodes.find((n) => n.id === edge.to);

      if (!fromNode || !toNode) return null;

      const points = [
        new THREE.Vector3(fromNode.x, fromNode.y, fromNode.z || 0),
        new THREE.Vector3(toNode.x, toNode.y, toNode.z || 0),
      ];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const material = new THREE.LineBasicMaterial({
        color: palette.edgeColor,
        linewidth: 3,
        transparent: true,
        opacity: 0.8,
      });

      const line = new THREE.Line(geometry, material);
      line.userData = { edge };
      return line;
    },
    [palette.edgeColor]
  );

  const renderGraph = useCallback(
    async (graphData: GraphData) => {
      if (!sceneRef.current || graphData.nodes.length === 0) {
        clearGraphObjects();
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        clearGraphObjects();

        const nodeGroups: THREE.Group[] = [];
        for (const nodeData of graphData.nodes) {
          const nodeGroup = createNodeMesh(nodeData);
          if (nodeGroup) {
            sceneRef.current!.add(nodeGroup);
            nodeGroups.push(nodeGroup);
          }
        }

        const edgeLines: THREE.Line[] = [];
        for (const edgeData of graphData.edges) {
          const edgeLine = createEdgeLine(edgeData, graphData.nodes);
          if (edgeLine) {
            sceneRef.current!.add(edgeLine);
            edgeLines.push(edgeLine);
          }
        }

        graphObjectsRef.current = { nodes: nodeGroups, edges: edgeLines };

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
    },
    [clearGraphObjects, createEdgeLine, createNodeMesh]
  );

  useEffect(() => {
    if (!sceneRef.current) return;

    sceneRef.current.background = new THREE.Color(palette.background);
    addLights(sceneRef.current, palette);
  }, [addLights, palette]);

  useEffect(() => {
    if (!canRender3D || !content) {
      clearGraphObjects();
      return;
    }

    const updateGraph = async () => {
      try {
        const graphData = await parseMermaidDiagram(content, theme);
        await renderGraph(graphData);
      } catch (err) {
        console.error('Error parsing diagram:', err);
        setError('Failed to parse diagram');
      }
    };

    void updateGraph();
  }, [canRender3D, clearGraphObjects, content, renderGraph, theme]);

  const handleResize = useCallback(() => {
    const container = containerRef.current;
    if (!container || !cameraRef.current || !rendererRef.current) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [handleResize]);

  useEffect(() => {
    if (containerRef.current && !sceneRef.current) {
      initializeScene();
    }
  }, [initializeScene]);

  useEffect(() => {
    const container = containerRef.current;
    const renderer = rendererRef.current;
    const domElement = renderer?.domElement;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      clearGraphObjects();

      if (domElement && container) {
        container.removeChild(domElement);
      }

      renderer?.dispose();
      controlsRef.current?.dispose();
    };
  }, [clearGraphObjects]);

  return (
    <div className={`relative h-full w-full overflow-hidden ${className || ''}`}> 
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{
          background: `linear-gradient(135deg, ${palette.backgroundGradient[0]} 0%, ${palette.backgroundGradient[1]} 100%)`,
        }}
      />

      {(isValidating || isLoading || error || !canRender3D) && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/80 backdrop-blur-sm">
          <div className="text-center">
            {!supports3D ? (
              <>
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-blue-500/20 rounded-full">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-blue-400 font-medium mb-2">3D Not Available</p>
                <p className="text-gray-400 text-sm">3D rendering is only available for flowcharts and graph diagrams</p>
              </>
            ) : isValidating || isLoading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4" />
                <p className="text-cyan-400 font-medium">
                  {isValidating ? 'Validating diagram…' : 'Rendering 3D scene…'}
                </p>
              </>
            ) : error ? (
              <>
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-red-500/20 rounded-full">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <p className="text-red-400 font-medium mb-2">3D Render Error</p>
                <p className="text-gray-400 text-sm">{error}</p>
              </>
            ) : !canRender ? (
              <>
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-yellow-500/20 rounded-full">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <p className="text-yellow-400 font-medium mb-2">Invalid Diagram</p>
                <p className="text-gray-400 text-sm">Fix syntax errors to render the 3D scene</p>
              </>
            ) : null}
          </div>
        </div>
      )}

      {canRender3D && !isLoading && !error && (
        <div className="absolute top-4 left-4 bg-dark-surface/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-dark-border">
          <p className="text-xs text-gray-400">
            <span className="text-cyan-400">Mouse:</span> Rotate • <span className="text-cyan-400">Scroll:</span> Zoom •{' '}
            <span className="text-cyan-400">Drag:</span> Pan
          </p>
        </div>
      )}
    </div>
  );
}
