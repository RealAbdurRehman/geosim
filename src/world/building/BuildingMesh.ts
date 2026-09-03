import * as THREE from "three";

import BuildingShape from "./BuildingShape";
import enableObjectShadow from "../../utils/enableObjectShadow";

import type { Building } from "./types";

export default class BuildingMesh {
  public readonly instance: THREE.Mesh;
  constructor(building: Building, shape: BuildingShape) {
    this.instance = new THREE.Mesh(
      this.getGeometry(building, shape),
      this.getMaterial(),
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
    const geometry = new THREE.ExtrudeGeometry(shape.instance, { depth });

    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, building.minHeight, 0);

    return geometry;
  }
  private getMaterial(): THREE.Material {
    return new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.8,
      metalness: 0,
    });
  }
  public dispose(): void {
    this.instance.geometry.dispose();

    const material = this.instance.material;
    if (Array.isArray(material)) material.forEach((mat) => mat.dispose());
    else material.dispose();
  }
}
