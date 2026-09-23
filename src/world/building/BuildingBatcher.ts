import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import BuildingShape from "./BuildingShape";
import BuildingMesh from "./BuildingMesh";
import { createOsmBuildingsMaterial } from "./materials/BuildingMaterial";

import type { LoadedBuilding } from "./types";

interface BatchBuildingsOptions {
  chunkSize?: number;
}

export interface BuildingChunk {
  chunkKey: string;
  centroid: THREE.Vector2;
  meshes: THREE.Mesh[];
}

const sharedMaterial = createOsmBuildingsMaterial();

function chunkKeyFor(x: number, z: number, chunkSize: number): string {
  const cx = Math.floor(x / chunkSize);
  const cz = Math.floor(z / chunkSize);
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

function setStaticUsage(geometry: THREE.BufferGeometry): void {
  for (const key of ["position", "normal", "color", "aHeight"] as const) {
    const attr = geometry.attributes[key];
    if (attr instanceof THREE.BufferAttribute)
      attr.setUsage(THREE.StaticDrawUsage);
  }
}

export function batchBuildings(
  buildings: LoadedBuilding[],
  options: BatchBuildingsOptions = {},
): BuildingChunk[] {
  const chunkSize = options.chunkSize ?? 120;

  const buckets = new Map<
    string,
    {
      geometries: THREE.BufferGeometry[];
      sumX: number;
      sumZ: number;
      count: number;
    }
  >();

  for (const { building } of buildings) {
    const centroid = footprintCentroid(building.footprint);
    const chunkKey = chunkKeyFor(centroid.x, centroid.z, chunkSize);

    const shape = new BuildingShape(building.footprint);
    const buildingMesh = new BuildingMesh(building, shape);
    const geometry = buildingMesh.instance.geometry;

    let bucket = buckets.get(chunkKey);
    if (!bucket) {
      bucket = { geometries: [], sumX: 0, sumZ: 0, count: 0 };
      buckets.set(chunkKey, bucket);
    }

    bucket.geometries.push(geometry);
    bucket.sumX += centroid.x;
    bucket.sumZ += centroid.z;
    bucket.count += 1;
  }

  const chunks: BuildingChunk[] = [];

  for (const [chunkKey, bucket] of buckets) {
    const merged = mergeGeometries(bucket.geometries, false);

    for (const g of bucket.geometries) g.dispose();

    if (!merged) {
      console.warn(`Failed to merge geometries for chunk ${chunkKey}`);
      continue;
    }

    merged.computeBoundingSphere();
    merged.computeBoundingBox();
    setStaticUsage(merged);

    const mesh = new THREE.Mesh(merged, sharedMaterial);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();

    chunks.push({
      chunkKey,
      centroid: new THREE.Vector2(
        bucket.sumX / bucket.count,
        bucket.sumZ / bucket.count,
      ),
      meshes: [mesh],
    });
  }

  return chunks;
}
