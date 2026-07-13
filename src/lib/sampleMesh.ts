export function generateSampleTorusKnot(): {
  positions: Float32Array;
  volumeCm3: number;
  dimensions: { x: number; y: number; z: number };
  surfaceAreaCm2: number;
  triangleCount: number;
} {
  const positions: number[] = [];
  const radialSegments = 120;
  const tubularSegments = 24;
  const p = 2; // wind count P
  const q = 3; // wind count Q
  const rTorus = 25; // torus major radius (mm)
  const rTube = 6;  // tube radius (mm)

  // Double loop to generate grid of vertices
  const getKnotPosition = (u: number, v: number) => {
    // Torus knot equation
    const theta = u * p;
    const r = rTorus + rTube * Math.cos(v);
    
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    const z = rTube * Math.sin(v) + 4 * Math.sin(u * q); // added slight wave for complexity
    
    return { x, y, z };
  };

  for (let i = 0; i < radialSegments; i++) {
    const u1 = (i / radialSegments) * Math.PI * 2;
    const u2 = ((i + 1) / radialSegments) * Math.PI * 2;

    for (let j = 0; j < tubularSegments; j++) {
      const v1 = (j / tubularSegments) * Math.PI * 2;
      const v2 = ((j + 1) / tubularSegments) * Math.PI * 2;

      // 4 corners of the quad
      const p1 = getKnotPosition(u1, v1);
      const p2 = getKnotPosition(u2, v1);
      const p3 = getKnotPosition(u2, v2);
      const p4 = getKnotPosition(u1, v2);

      // Triangle 1 (p1, p2, p3)
      positions.push(p1.x, p1.y, p1.z);
      positions.push(p2.x, p2.y, p2.z);
      positions.push(p3.x, p3.y, p3.z);

      // Triangle 2 (p1, p3, p4)
      positions.push(p1.x, p1.y, p1.z);
      positions.push(p3.x, p3.y, p3.z);
      positions.push(p4.x, p4.y, p4.z);
    }
  }

  const positionsArray = new Float32Array(positions);
  const triangleCount = positionsArray.length / 9;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  let totalVolumeMm3 = 0;
  let totalAreaMm2 = 0;

  for (let i = 0; i < triangleCount; i++) {
    const pIdx = i * 9;
    const v1x = positionsArray[pIdx], v1y = positionsArray[pIdx + 1], v1z = positionsArray[pIdx + 2];
    const v2x = positionsArray[pIdx + 3], v2y = positionsArray[pIdx + 4], v2z = positionsArray[pIdx + 5];
    const v3x = positionsArray[pIdx + 6], v3y = positionsArray[pIdx + 7], v3z = positionsArray[pIdx + 8];

    // Bounding Box
    minX = Math.min(minX, v1x, v2x, v3x); maxX = Math.max(maxX, v1x, v2x, v3x);
    minY = Math.min(minY, v1y, v2y, v3y); maxY = Math.max(maxY, v1y, v2y, v3y);
    minZ = Math.min(minZ, v1z, v2z, v3z); maxZ = Math.max(maxZ, v1z, v2z, v3z);

    // Volume calculation
    const signedVol = (v1x * (v2y * v3z - v2z * v3y) + 
                       v1y * (v2z * v3x - v2x * v3z) + 
                       v1z * (v2x * v3y - v2y * v3x)) / 6.0;
    totalVolumeMm3 += signedVol;

    // Surface Area calculation
    const ax = v2x - v1x, ay = v2y - v1y, az = v2z - v1z;
    const bx = v3x - v1x, by = v3y - v1y, bz = v3z - v1z;
    const cx = ay * bz - az * by;
    const cy = az * bx - ax * bz;
    const cz = ax * by - ay * bx;
    const area = Math.sqrt(cx * cx + cy * cy + cz * cz) * 0.5;
    totalAreaMm2 += area;
  }

  return {
    positions: positionsArray,
    volumeCm3: Math.abs(totalVolumeMm3) / 1000.0,
    dimensions: {
      x: Math.max(1, maxX - minX),
      y: Math.max(1, maxY - minY),
      z: Math.max(1, maxZ - minZ)
    },
    surfaceAreaCm2: totalAreaMm2 / 100.0,
    triangleCount
  };
}
