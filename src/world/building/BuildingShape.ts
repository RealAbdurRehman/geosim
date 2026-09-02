import * as THREE from "three";

import { geoPointToLocal } from "../../geo/Projection";
import type { GeoPoint, OSMElement } from "../../geo/types";

export default class BuildingShape {
  public readonly instance: THREE.Shape;
  constructor(building: OSMElement, origin: GeoPoint) {
    this.instance = new THREE.Shape();

    if (!building.geometry) return;
    for (const [index, point] of building.geometry.entries()) {
      const local = geoPointToLocal(point, origin);
      if (index === 0) this.instance.moveTo(local.x, -local.z);
      else this.instance.lineTo(local.x, -local.z);
    }

    this.instance.closePath();
  }
}
