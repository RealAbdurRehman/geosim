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

function materialKey(mat: THREE.MeshStandardMaterial): string {
  const mapId = mat.map ? mat.map.uuid : "nomap";
  const colorHex = mat.color.getHexString();
  return `${colorHex}_${mat.roughness}_${mat.metalness}_${mapId}`;
}

function chunkKeyFor(
  geometry: THREE.BufferGeometry,
  chunkSize: number,
): string {
  const pos = geometry.attributes.position;
  let sumX = 0;
  let sumZ = 0;
  for (let i = 0; i < pos.count; i++) {
    sumX += pos.getX(i);
    sumZ += pos.getZ(i);
  }
  const centroidX = sumX / pos.count;
  const centroidZ = sumZ / pos.count;

  const cx = Math.floor(centroidX / chunkSize);
  const cz = Math.floor(centroidZ / chunkSize);
  return `${cx}_${cz}`;
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

export function batchBuildings(
  buildings: LoadedBuilding[],
  options: BatchBuildingsOptions = {
    castShadow: true,
    receiveShadow: true,
    chunkSize: 120,
  },
): THREE.Mesh[] {
  const chunkSize = options.chunkSize ?? 120;

  const groups = new Map<
    string,
    { material: THREE.Material; geometries: THREE.BufferGeometry[] }
  >();

  for (const { building } of buildings) {
    const shape = new BuildingShape(building.footprint);
    const buildingMesh = new BuildingMesh(building, shape);
    const materials = buildingMesh.instance
      .material as THREE.MeshStandardMaterial[];

    const parts = extractGroupGeometries(buildingMesh.instance.geometry);
    for (const part of parts) {
      const mat = materials[part.materialIndex];
      const matKey = materialKey(mat);
      const chunkKey = chunkKeyFor(part.geometry, chunkSize);
      const key = `${matKey}_${chunkKey}`;

      if (!groups.has(key)) groups.set(key, { material: mat, geometries: [] });
      groups.get(key)!.geometries.push(part.geometry);
    }

    buildingMesh.dispose();
  }

  const mergedMeshes: THREE.Mesh[] = [];
  for (const { material, geometries } of groups.values()) {
    if (geometries.length === 0) continue;

    const mergedGeometry = mergeGeometries(geometries, false);
    mergedGeometry.computeBoundingSphere();
    mergedGeometry.computeBoundingBox();

    const mesh = new THREE.Mesh(mergedGeometry, material);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    mesh.frustumCulled = true;

    enableObjectShadow({
      object: mesh,
      shouldCast: options.castShadow,
      shouldReceive: options.receiveShadow,
    });

    mergedMeshes.push(mesh);
  }

  return mergedMeshes;
}
