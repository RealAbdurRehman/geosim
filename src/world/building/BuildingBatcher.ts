import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import BuildingShape from "./BuildingShape";
import BuildingMesh from "./BuildingMesh";
import enableObjectShadow from "../../utils/enableObjectShadow";
import type { LoadedBuilding } from "./types";

interface BatchBuildingsOptions {
  castShadow?: boolean;
  receiveShadow?: boolean;
  chunkSize?: number;
}

export interface BuildingChunk {
  chunkKey: string;
  centroid: THREE.Vector2;
  meshes: THREE.Mesh[];
}

interface ChunkBucket {
  centroidSumX: number;
  centroidSumZ: number;
  centroidCount: number;
  groups: Map<
    string,
    { material: THREE.Material; geometries: THREE.BufferGeometry[] }
  >;
}

function materialKey(mat: THREE.MeshStandardMaterial): string {
  const mapId = mat.map ? mat.map.uuid : "nomap";
  const colorHex = mat.color.getHexString();
  const roughnessBucket = Math.round(mat.roughness * 20) / 20;
  return `${colorHex}_${roughnessBucket}_${mat.metalness}_${mapId}`;
}

function chunkKeyFor(
  centroidX: number,
  centroidZ: number,
  chunkSize: number,
): string {
  const cx = Math.floor(centroidX / chunkSize);
  const cz = Math.floor(centroidZ / chunkSize);
  return `${cx}_${cz}`;
}

function footprintCentroid(footprint: { x: number; z: number }[]): {
  x: number;
  z: number;
} {
  let sumX = 0;
  let sumZ = 0;
  for (const p of footprint) {
    sumX += p.x;
    sumZ += p.z;
  }
  return { x: sumX / footprint.length, z: sumZ / footprint.length };
}

function extractGroupGeometries(
  geometry: THREE.BufferGeometry,
): { geometry: THREE.BufferGeometry; materialIndex: number }[] {
  const flat = geometry.index ? geometry.toNonIndexed() : geometry;
  const positions = flat.attributes.position.array as Float32Array;
  const normals = flat.attributes.normal.array as Float32Array;
  const uvs = flat.attributes.uv.array as Float32Array;

  return geometry.groups.map((group) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(
        positions.slice(group.start * 3, (group.start + group.count) * 3),
        3,
      ),
    );
    geo.setAttribute(
      "normal",
      new THREE.BufferAttribute(
        normals.slice(group.start * 3, (group.start + group.count) * 3),
        3,
      ),
    );
    geo.setAttribute(
      "uv",
      new THREE.BufferAttribute(
        uvs.slice(group.start * 2, (group.start + group.count) * 2),
        2,
      ),
    );

    return { geometry: geo, materialIndex: group.materialIndex ?? 0 };
  });
}

function setStaticUsage(geometry: THREE.BufferGeometry): void {
  for (const key of ["position", "normal", "uv"] as const) {
    const attribute = geometry.attributes[key];
    if (attribute instanceof THREE.BufferAttribute)
      attribute.setUsage(THREE.StaticDrawUsage);
  }
}

function buildMesh(
  material: THREE.Material,
  geometries: THREE.BufferGeometry[],
  castShadow: boolean,
  receiveShadow: boolean,
): THREE.Mesh | null {
  if (geometries.length === 0) return null;

  const mergedGeometry = mergeGeometries(geometries, false);
  mergedGeometry.computeBoundingSphere();
  mergedGeometry.computeBoundingBox();
  setStaticUsage(mergedGeometry);

  const mesh = new THREE.Mesh(mergedGeometry, material);
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  mesh.frustumCulled = true;

  enableObjectShadow({
    object: mesh,
    shouldCast: castShadow,
    shouldReceive: receiveShadow,
  });
  return mesh;
}

export function batchBuildings(
  buildings: LoadedBuilding[],
  options: BatchBuildingsOptions = {
    castShadow: true,
    receiveShadow: true,
    chunkSize: 120,
  },
): BuildingChunk[] {
  const chunkSize = options.chunkSize ?? 120;
  const castShadow = options.castShadow ?? true;
  const receiveShadow = options.receiveShadow ?? true;
  const chunks = new Map<string, ChunkBucket>();

  const getBucket = (
    chunkKey: string,
    centroid: { x: number; z: number },
  ): ChunkBucket => {
    let bucket = chunks.get(chunkKey);
    if (!bucket) {
      bucket = {
        centroidSumX: 0,
        centroidSumZ: 0,
        centroidCount: 0,
        groups: new Map(),
      };
      chunks.set(chunkKey, bucket);
    }
    bucket.centroidSumX += centroid.x;
    bucket.centroidSumZ += centroid.z;
    bucket.centroidCount += 1;
    return bucket;
  };

  for (const { building } of buildings) {
    const centroid = footprintCentroid(building.footprint);
    const chunkKey = chunkKeyFor(centroid.x, centroid.z, chunkSize);
    const bucket = getBucket(chunkKey, centroid);

    const shape = new BuildingShape(building.footprint);
    const buildingMesh = new BuildingMesh(building, shape);
    const materials = buildingMesh.instance
      .material as THREE.MeshStandardMaterial[];
    const parts = extractGroupGeometries(buildingMesh.instance.geometry);

    for (const part of parts) {
      const mat = materials[part.materialIndex];
      const key = materialKey(mat);
      if (!bucket.groups.has(key))
        bucket.groups.set(key, { material: mat, geometries: [] });
      bucket.groups.get(key)!.geometries.push(part.geometry);
    }

    buildingMesh.dispose();
  }

  const result: BuildingChunk[] = [];
  for (const [chunkKey, bucket] of chunks.entries()) {
    const centroid = new THREE.Vector2(
      bucket.centroidSumX / bucket.centroidCount,
      bucket.centroidSumZ / bucket.centroidCount,
    );

    const meshes = [...bucket.groups.values()]
      .map((g) =>
        buildMesh(g.material, g.geometries, castShadow, receiveShadow),
      )
      .filter((m): m is THREE.Mesh => m !== null);

    result.push({ chunkKey, centroid, meshes });
  }

  return result;
}
