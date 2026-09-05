import * as THREE from "three";
import { ImprovedNoise, createSeededRandom, fbm } from "./ImprovedNoise";

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function bake3DCloudVolume(params: {
  size: number;
  noiseScale: number;
  seed: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  noiseIntensity: number;
  coverage: number;
  softness: number;
}): THREE.Data3DTexture {
  const {
    size,
    noiseScale,
    seed,
    octaves,
    persistence,
    lacunarity,
    noiseIntensity,
    coverage,
    softness,
  } = params;
  const data = new Uint8Array(size * size * size);
  const seededRandom = createSeededRandom(seed);
  const perlin = new ImprovedNoise(seededRandom);
  let index = 0;

  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / (size - 1),
          ny = y / (size - 1),
          nz = z / (size - 1);
        const bx = nx * noiseScale + seed,
          by = ny * noiseScale + seed,
          bz = nz * noiseScale + seed;
        const fbmArgs: [number, number, number] = [
          octaves,
          persistence,
          lacunarity,
        ];

        const n1 = fbm(perlin, bx, by, bz, ...fbmArgs);
        const n2 = fbm(perlin, bx - noiseScale, by, bz, ...fbmArgs);
        const n3 = fbm(perlin, bx, by - noiseScale, bz, ...fbmArgs);
        const n4 = fbm(perlin, bx, by, bz - noiseScale, ...fbmArgs);
        const n5 = fbm(
          perlin,
          bx - noiseScale,
          by - noiseScale,
          bz,
          ...fbmArgs,
        );
        const n6 = fbm(
          perlin,
          bx - noiseScale,
          by,
          bz - noiseScale,
          ...fbmArgs,
        );
        const n7 = fbm(
          perlin,
          bx,
          by - noiseScale,
          bz - noiseScale,
          ...fbmArgs,
        );
        const n8 = fbm(
          perlin,
          bx - noiseScale,
          by - noiseScale,
          bz - noiseScale,
          ...fbmArgs,
        );

        const wx = 1 - nx,
          wy = 1 - ny,
          wz = 1 - nz;
        let noiseVal =
          n1 * wx * wy * wz +
          n2 * nx * wy * wz +
          n3 * wx * ny * wz +
          n4 * wx * wy * nz +
          n5 * nx * ny * wz +
          n6 * nx * wy * nz +
          n7 * wx * ny * nz +
          n8 * nx * ny * nz;

        noiseVal = (noiseVal + 1.0) / 2.0;
        const finalVal = Math.pow(noiseVal, noiseIntensity);
        const density = smoothstep(
          coverage - softness,
          coverage + softness,
          finalVal,
        );

        data[index++] = Math.floor(density * 255);
      }
    }
  }

  const texture = new THREE.Data3DTexture(data, size, size, size);
  texture.format = THREE.RedFormat;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.wrapR = THREE.RepeatWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  return texture;
}

export function bake3DSphericalNoise(
  size: number,
  seed: number,
  frequency: number,
): THREE.Data3DTexture {
  const data = new Uint8Array(size * size * size);
  const seededRandom = createSeededRandom(seed);
  const perlin = new ImprovedNoise(seededRandom);
  const dir = new THREE.Vector3();

  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        dir.set(
          (x / (size - 1)) * 2 - 1,
          (y / (size - 1)) * 2 - 1,
          (z / (size - 1)) * 2 - 1,
        );
        if (dir.lengthSq() > 0) {
          dir.normalize().multiplyScalar(frequency);
          const noise = perlin.noise(dir.x, dir.y, dir.z);
          data[z * size * size + y * size + x] = Math.floor(
            (noise * 0.5 + 0.5) * 255,
          );
        }
      }
    }
  }

  const texture = new THREE.Data3DTexture(data, size, size, size);
  texture.format = THREE.RedFormat;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  return texture;
}

export function createProceduralDitherTexture(size = 64): THREE.DataTexture {
  const data = new Uint8Array(size * size);
  for (let i = 0; i < size * size; i++) {
    data[i] = Math.floor(Math.random() * 256);
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;

  return texture;
}
