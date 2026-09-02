import * as THREE from "three";

import BuildingShape from "./BuildingShape";
import Config from "./config/BuildingConfig";
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
  private getHeight(building: Building): number {
    const tags = building.tags;
    if (!tags) return Config.defaultBuildingHeight;

    const height = Number.parseFloat(tags["height"] ?? "");
    if (Number.isFinite(height) && height > 0) return height;

    const levels = Number.parseFloat(tags["building:levels"] ?? "");
    if (Number.isFinite(levels) && levels > 0)
      return levels * Config.metersPerLevel;

    return Config.defaultBuildingHeight;
  }
  private getGeometry(
    building: Building,
    shape: BuildingShape,
  ): THREE.ExtrudeGeometry {
    const geometry = new THREE.ExtrudeGeometry(shape.instance, {
      depth: this.getHeight(building),
      bevelEnabled: false,
    });

    geometry.rotateX(-Math.PI / 2);

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
