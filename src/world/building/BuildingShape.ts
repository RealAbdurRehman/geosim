import * as THREE from "three";
import type { LocalPoint } from "../../geo/types";

export default class BuildingShape {
  public readonly instance: THREE.Shape;
  constructor(footprint: LocalPoint[]) {
    this.instance = new THREE.Shape();

    if (!footprint.length) return;
    for (const [index, point] of footprint.entries()) {
      if (index === 0) this.instance.moveTo(point.x, -point.z);
      else this.instance.lineTo(point.x, -point.z);
    }

    this.instance.closePath();
  }
}
