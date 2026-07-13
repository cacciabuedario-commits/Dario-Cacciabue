export interface ParsedSTL {
  positions: Float32Array;
  volumeCm3: number;
  dimensions: { x: number; y: number; z: number };
  surfaceAreaCm2: number;
  triangleCount: number;
}

export function parseSTL(buffer: ArrayBuffer): ParsedSTL {
  const byteLength = buffer.byteLength;
  
  // Quick check for binary STL
  // Binary files start with an 80-byte header, followed by a 4-byte face count (uint32).
  // Each face is exactly 50 bytes.
  let isBinary = false;
  let triangleCount = 0;
  
  if (byteLength >= 84) {
    const reader = new DataView(buffer);
    triangleCount = reader.getUint32(80, true);
    const expectedBinarySize = 80 + 4 + triangleCount * 50;
    
    if (byteLength === expectedBinarySize || byteLength === expectedBinarySize + 2) {
      isBinary = true;
    }
  }

  if (isBinary) {
    return parseBinarySTL(buffer, triangleCount);
  } else {
    return parseAsciiSTL(buffer);
  }
}

function parseBinarySTL(buffer: ArrayBuffer, triangleCount: number): ParsedSTL {
  const reader = new DataView(buffer);
  const positions = new Float32Array(triangleCount * 9);
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  let totalVolumeMm3 = 0;
  let totalAreaMm2 = 0;
  
  let offset = 84;
  for (let i = 0; i < triangleCount; i++) {
    // Normal vector (12 bytes) - skip or read if needed
    const nx = reader.getFloat32(offset, true);
    const ny = reader.getFloat32(offset + 4, true);
    const nz = reader.getFloat32(offset + 8, true);
    offset += 12;
    
    // Vertex 1 (12 bytes)
    const v1x = reader.getFloat32(offset, true);
    const v1y = reader.getFloat32(offset + 4, true);
    const v1z = reader.getFloat32(offset + 8, true);
    offset += 12;
    
    // Vertex 2 (12 bytes)
    const v2x = reader.getFloat32(offset, true);
    const v2y = reader.getFloat32(offset + 4, true);
    const v2z = reader.getFloat32(offset + 8, true);
    offset += 12;
    
    // Vertex 3 (12 bytes)
    const v3x = reader.getFloat32(offset, true);
    const v3y = reader.getFloat32(offset + 4, true);
    const v3z = reader.getFloat32(offset + 8, true);
    offset += 12;
    
    // Attribute byte count (2 bytes)
    offset += 2;
    
    // Store positions
    const pIdx = i * 9;
    positions[pIdx] = v1x; positions[pIdx + 1] = v1y; positions[pIdx + 2] = v1z;
    positions[pIdx + 3] = v2x; positions[pIdx + 4] = v2y; positions[pIdx + 5] = v2z;
    positions[pIdx + 6] = v3x; positions[pIdx + 7] = v3y; positions[pIdx + 8] = v3z;
    
    // Update bounding box
    minX = Math.min(minX, v1x, v2x, v3x); maxX = Math.max(maxX, v1x, v2x, v3x);
    minY = Math.min(minY, v1y, v2y, v3y); maxY = Math.max(maxY, v1y, v2y, v3y);
    minZ = Math.min(minZ, v1z, v2z, v3z); maxZ = Math.max(maxZ, v1z, v2z, v3z);
    
    // Compute signed volume of tetrahedron with origin
    const signedVol = (v1x * (v2y * v3z - v2z * v3y) + 
                       v1y * (v2z * v3x - v2x * v3z) + 
                       v1z * (v2x * v3y - v2y * v3x)) / 6.0;
    totalVolumeMm3 += signedVol;
    
    // Compute triangle surface area
    // Cross product of (v2 - v1) and (v3 - v1)
    const ax = v2x - v1x, ay = v2y - v1y, az = v2z - v1z;
    const bx = v3x - v1x, by = v3y - v1y, bz = v3z - v1z;
    const cx = ay * bz - az * by;
    const cy = az * bx - ax * bz;
    const cz = ax * by - ay * bx;
    const area = Math.sqrt(cx * cx + cy * cy + cz * cz) * 0.5;
    totalAreaMm2 += area;
  }
  
  // Safe bounds check
  if (minX === Infinity) {
    minX = minY = minZ = 0;
    maxX = maxY = maxZ = 0;
  }
  
  return {
    positions,
    volumeCm3: Math.abs(totalVolumeMm3) / 1000.0, // mm³ to cm³
    dimensions: {
      x: Math.max(0.1, maxX - minX),
      y: Math.max(0.1, maxY - minY),
      z: Math.max(0.1, maxZ - minZ)
    },
    surfaceAreaCm2: totalAreaMm2 / 100.0, // mm² to cm²
    triangleCount
  };
}

function parseAsciiSTL(buffer: ArrayBuffer): ParsedSTL {
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(buffer);
  
  // Regex to extract all vertices
  const vertexRegex = /vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g;
  const vertices: number[] = [];
  
  let match;
  while ((match = vertexRegex.exec(text)) !== null) {
    vertices.push(
      parseFloat(match[1]),
      parseFloat(match[2]),
      parseFloat(match[3])
    );
  }
  
  const triangleCount = Math.floor(vertices.length / 9);
  const positions = new Float32Array(triangleCount * 9);
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  let totalVolumeMm3 = 0;
  let totalAreaMm2 = 0;
  
  for (let i = 0; i < triangleCount; i++) {
    const pIdx = i * 9;
    const v1x = vertices[pIdx], v1y = vertices[pIdx + 1], v1z = vertices[pIdx + 2];
    const v2x = vertices[pIdx + 3], v2y = vertices[pIdx + 4], v2z = vertices[pIdx + 5];
    const v3x = vertices[pIdx + 6], v3y = vertices[pIdx + 7], v3z = vertices[pIdx + 8];
    
    positions[pIdx] = v1x; positions[pIdx + 1] = v1y; positions[pIdx + 2] = v1z;
    positions[pIdx + 3] = v2x; positions[pIdx + 4] = v2y; positions[pIdx + 5] = v2z;
    positions[pIdx + 6] = v3x; positions[pIdx + 7] = v3y; positions[pIdx + 8] = v3z;
    
    minX = Math.min(minX, v1x, v2x, v3x); maxX = Math.max(maxX, v1x, v2x, v3x);
    minY = Math.min(minY, v1y, v2y, v3y); maxY = Math.max(maxY, v1y, v2y, v3y);
    minZ = Math.min(minZ, v1z, v2z, v3z); maxZ = Math.max(maxZ, v1z, v2z, v3z);
    
    const signedVol = (v1x * (v2y * v3z - v2z * v3y) + 
                       v1y * (v2z * v3x - v2x * v3z) + 
                       v1z * (v2x * v3y - v2y * v3x)) / 6.0;
    totalVolumeMm3 += signedVol;
    
    const ax = v2x - v1x, ay = v2y - v1y, az = v2z - v1z;
    const bx = v3x - v1x, by = v3y - v1y, bz = v3z - v1z;
    const cx = ay * bz - az * by;
    const cy = az * bx - ax * bz;
    const cz = ax * by - ay * bx;
    const area = Math.sqrt(cx * cx + cy * cy + cz * cz) * 0.5;
    totalAreaMm2 += area;
  }
  
  if (minX === Infinity) {
    minX = minY = minZ = 0;
    maxX = maxY = maxZ = 0;
  }
  
  return {
    positions,
    volumeCm3: Math.abs(totalVolumeMm3) / 1000.0,
    dimensions: {
      x: Math.max(0.1, maxX - minX),
      y: Math.max(0.1, maxY - minY),
      z: Math.max(0.1, maxZ - minZ)
    },
    surfaceAreaCm2: totalAreaMm2 / 100.0,
    triangleCount
  };
}
