import * as THREE from "three";

import BuildingShape from "./BuildingShape";
import enableObjectShadow from "../../utils/enableObjectShadow";

import type { Building } from "./types";

function verticalNudgeFor(id: number): number {
  const hash = Math.abs(Math.sin(id) * 10000);
  return (hash % 1) * 0.2;
}

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

export default class BuildingMesh {
  public readonly instance: THREE.Mesh;
  constructor(building: Building, shape: BuildingShape) {
    this.instance = new THREE.Mesh(
      this.getGeometry(building, shape),
      this.getMaterial(building),
    );

    this.init();
  }
  private init(): void {
    enableObjectShadow({ object: this.instance });
  }
  private getGeometry(
    building: Building,
    shape: BuildingShape,
  ): THREE.ExtrudeGeometry {
    const depth = Math.max(building.height - building.minHeight, 0.01);
    const geometry = new THREE.ExtrudeGeometry(shape.instance, {
      depth,
      bevelEnabled: false,
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(
      0,
      building.minHeight + verticalNudgeFor(building.id),
      0,
    );

    return geometry;
  }
  private getMaterial(building: Building): THREE.Material {
    const key = `${building.material.color}_${building.material.roughness}_${building.material.metalness}`;
    if (materialCache.has(key)) return materialCache.get(key)!;

    const material = new THREE.MeshStandardMaterial({
      color: building.material.color,
      roughness: building.material.roughness,
      metalness: building.material.metalness,
    });

    materialCache.set(key, material);
    return material;
  }
  public dispose(): void {
    this.instance.geometry.dispose();
  }
}
