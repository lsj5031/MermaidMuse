import mermaid from 'mermaid';
import { type DiagramTheme, getNodeColorForTheme } from '@theme/diagramThemes';

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  z?: number;
  width: number;
  height: number;
  type: string;
  color?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  type: string;
  points: Array<[number, number]>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export const parseMermaidDiagram = async (
  content: string,
  theme: DiagramTheme = 'cyber'
): Promise<GraphData> => {
  if (!content.trim()) {
    return {
      nodes: [],
      edges: [],
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
    };
  }

  try {
    // Parse the diagram to get structured data
    await mermaid.parse(content);

    // Extract graph structure from content
    const graphData = await extractGraphStructure(content, theme);

    return graphData;
  } catch (error) {
    console.warn('Failed to parse Mermaid diagram:', error);
    return {
      nodes: [],
      edges: [],
      bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
    };
  }
};

const extractGraphStructure = async (content: string, theme: DiagramTheme): Promise<GraphData> => {
  // Enhanced parsing for Mermaid diagrams
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Extract diagram type and direction
  const typeMatch = content.match(/^(graph|flowchart)\s+([A-Za-z]+)/m);
  const isDirected = typeMatch
    ? typeMatch[2].includes('TD') ||
      typeMatch[2].includes('LR') ||
      typeMatch[2].includes('TB') ||
      typeMatch[2].includes('BT') ||
      typeMatch[2].includes('RL')
    : false;

  // Extract nodes - more comprehensive regex patterns
  const nodePatterns = [
    // A[Label] - rectangular nodes
    /([A-Za-z0-9_]+)\s*\[\s*([^\]]+)\s*\]/g,
    // A{Label} - diamond nodes
    /([A-Za-z0-9_]+)\s*\{\s*([^}]+)\s*\}/g,
    // A(Label) - circular nodes
    /([A-Za-z0-9_]+)\s*\(\s*([^)]+)\s*\)/g,
    // A[[Label]] - subroutine nodes
    /([A-Za-z0-9_]+)\s*\[\[\s*([^\]]+)\s*\]\]/g,
    // A[(Label)] - database nodes
    /([A-Za-z0-9_]+)\s*\[\[\s*([^\]]+)\s*\]\]/g,
    // A{{Label}} - hexagon nodes
    /([A-Za-z0-9_]+)\s*\{\{\s*([^}]+)\s*\}\}/g,
  ];

  for (const pattern of nodePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const [, id, label] = match;
      if (!nodes.find((n) => n.id === id)) {
        nodes.push({
          id,
          label: label.trim(),
          x: 0, // Will be calculated later
          y: 0, // Will be calculated later
          z: 0,
          width: Math.max(2, label.length * 0.6),
          height: 1.2,
          type: getNodeType(match[0]),
          color: getNodeColor(theme, id),
        });
      }
    }
  }

  // Extract edges with more patterns
  const edgePatterns = [
    // A --> B - directed edge
    /([A-Za-z0-9_]+)\s*-->\s*(?:\|([^|]+)\|)?\s*([A-Za-z0-9_]+)/g,
    // A --- B - undirected edge
    /([A-Za-z0-9_]+)\s*---\s*(?:\|([^|]+)\|)?\s*([A-Za-z0-9_]+)/g,
    // A -.-> B - dotted edge
    /([A-Za-z0-9_]+)\s*-\.\s*>\s*(?:\|([^|]+)\|)?\s*([A-Za-z0-9_]+)/g,
    // A == B - thick edge
    /([A-Za-z0-9_]+)\s*==\s*(?:\|([^|]+)\|)?\s*([A-Za-z0-9_]+)/g,
    // A -.-> B - dotted edge
    /([A-Za-z0-9_]+)\s*-\.(?:\|([^|]+)\|)?\s*([A-Za-z0-9_]+)/g,
    // A -.-> B - dotted directed edge
    /([A-Za-z0-9_]+)\s*-\.\s*>\s*(?:\|([^|]+)\|)?\s*([A-Za-z0-9_]+)/g,
  ];

  for (const pattern of edgePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const [, from, label, to] = match;
      const edgeType = match[0].includes('-->')
        ? 'arrow'
        : match[0].includes('---')
          ? 'line'
          : match[0].includes('-.')
            ? 'dotted'
            : match[0].includes('==')
              ? 'thick'
              : 'arrow';

      edges.push({
        from,
        to,
        label: label?.trim(),
        type: edgeType,
        points: [
          [0, 0],
          [1, 0],
        ],
      });
    }
  }

  // If we found nodes, calculate positions using a simple layout algorithm
  if (nodes.length > 0) {
    calculateLayout(nodes, edges, isDirected);
  }

  // Calculate bounds
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = xs.length > 0 ? Math.min(...xs) : 0;
  const maxX = xs.length > 0 ? Math.max(...xs) : 1;
  const minY = ys.length > 0 ? Math.min(...ys) : 0;
  const maxY = ys.length > 0 ? Math.max(...ys) : 1;

  return {
    nodes,
    edges,
    bounds: {
      minX: minX - 2,
      maxX: maxX + 2,
      minY: minY - 2,
      maxY: maxY + 2,
    },
  };
};

// Simple layout algorithm for positioning nodes
const calculateLayout = (nodes: GraphNode[], edges: GraphEdge[], isDirected: boolean) => {
  if (nodes.length === 0) return;

  // Create adjacency list
  const adjacency = new Map<string, string[]>();
  const indegree = new Map<string, number>();

  nodes.forEach((node) => {
    adjacency.set(node.id, []);
    indegree.set(node.id, 0);
  });

  edges.forEach((edge) => {
    if (adjacency.has(edge.from)) {
      adjacency.get(edge.from)!.push(edge.to);
      indegree.set(edge.to, (indegree.get(edge.to) || 0) + 1);
    }
  });

  // Find root nodes (nodes with no incoming edges)
  const roots: string[] = [];
  nodes.forEach((node) => {
    if ((indegree.get(node.id) || 0) === 0) {
      roots.push(node.id);
    }
  });

  // If no roots found, use first node
  if (roots.length === 0 && nodes.length > 0) {
    roots.push(nodes[0].id);
  }

  // BFS to assign levels and positions
  const levelMap = new Map<string, number>();
  const queue = [...roots];
  const visited = new Set<string>();

  roots.forEach((root) => levelMap.set(root, 0));

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = adjacency.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const currentLevel = levelMap.get(current) || 0;
        levelMap.set(neighbor, currentLevel + 1);
        queue.push(neighbor);
      }
    }
  }

  // Group nodes by level
  const levelGroups = new Map<number, GraphNode[]>();
  nodes.forEach((node) => {
    const level = levelMap.get(node.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(node);
  });

  // Position nodes in grid layout
  const nodeSpacing = 4;
  const levelSpacing = 6;
  let maxLevel = 0;

  levelGroups.forEach((levelNodes, level) => {
    maxLevel = Math.max(maxLevel, level);

    const levelCount = levelNodes.length;
    const totalWidth = (levelCount - 1) * nodeSpacing;

    levelNodes.forEach((node, index) => {
      const xOffset = -totalWidth / 2 + index * nodeSpacing;
      node.x = xOffset;
      node.y = level * levelSpacing;
      node.z = Math.random() * 2 - 1; // Add slight z variation for 3D effect
    });
  });

  // Center the layout
  if (isDirected) {
    // For directed graphs, shift to center on Y axis
    const centerOffset = (maxLevel * levelSpacing) / 2;
    nodes.forEach((node) => {
      node.y -= centerOffset;
    });
  }
};

const getNodeType = (nodeDef: string): string => {
  if (nodeDef.includes('[')) return 'rect';
  if (nodeDef.includes('{')) return 'diamond';
  if (nodeDef.includes('(')) return 'circle';
  return 'rect';
};

const getNodeColor = (theme: DiagramTheme, nodeId: string): string => {
  return getNodeColorForTheme(theme, nodeId);
};

export const calculateOptimalCamera = (graphData: GraphData) => {
  if (graphData.nodes.length === 0) {
    return {
      position: { x: 0, y: 0, z: 10 },
      target: { x: 0, y: 0, z: 0 },
    };
  }

  const { bounds } = graphData;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const maxDim = Math.max(width, height);

  // Position camera at an angle to see the 3D structure
  const distance = Math.max(10, maxDim * 2);
  const position = {
    x: centerX + distance * 0.5,
    y: centerY + distance * 0.3,
    z: distance,
  };

  return {
    position,
    target: { x: centerX, y: centerY, z: 0 },
  };
};
