import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import BuildingShape from "./BuildingShape";
import BuildingMesh from "./BuildingMesh";
import enableObjectShadow from "../../utils/enableObjectShadow";
import type { LoadedBuilding } from "./types";

interface BatchBuildingsOptions {
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export function batchBuildings(
  buildings: LoadedBuilding[],
  options: BatchBuildingsOptions = { castShadow: true, receiveShadow: true },
): THREE.Mesh[] {
  const groups = new Map<
    string,
    { material: THREE.Material; geometries: THREE.BufferGeometry[] }
  >();

  for (const { building } of buildings) {
    const shape = new BuildingShape(building.footprint);
    const buildingMesh = new BuildingMesh(building, shape);
    const mat = buildingMesh.instance.material as THREE.MeshStandardMaterial;
    const key = `${mat.color.getHexString()}_${mat.roughness}_${mat.metalness}`;
    if (!groups.has(key)) groups.set(key, { material: mat, geometries: [] });

    groups.get(key)!.geometries.push(buildingMesh.instance.geometry);
  }

  const mergedMeshes: THREE.Mesh[] = [];
  for (const { material, geometries } of groups.values()) {
    if (geometries.length === 0) continue;

    const mergedGeometry = mergeGeometries(geometries, false);
    const mesh = new THREE.Mesh(mergedGeometry, material);
    enableObjectShadow({
      object: mesh,
      shouldCast: options.castShadow,
      shouldReceive: options.receiveShadow,
    });

    mergedMeshes.push(mesh);
  }

  return mergedMeshes;
}
