import * as THREE from "three";

import BuildingShape from "./BuildingShape";
import enableObjectShadow from "../../utils/enableObjectShadow";
import getProceduralTextures from "./materials/ProceduralTextures";

import type { Building, FacadeTextureType } from "./types";
import type { LocalPoint } from "../../geo/types";

function verticalNudgeFor(id: number): number {
  const hash = Math.abs(Math.sin(id) * 10000);
  return (hash % 1) * 0.2;
}

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

export default class BuildingMesh {
  public readonly instance: THREE.Mesh;
  constructor(building: Building, shape: BuildingShape) {
    this.instance = new THREE.Mesh(
      this.buildMetricGeometry(building, shape),
      this.getMaterial(building),
    );

    this.init();
  }
  private init(): void {
    enableObjectShadow({ object: this.instance });
  }
  private buildMetricGeometry(
    building: Building,
    shape: BuildingShape,
  ): THREE.BufferGeometry {
    const depth = Math.max(building.height - building.minHeight, 0.1);
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

    this.applyMetricUVs(geometry, building.footprint);
    return geometry;
  }
  private applyMetricUVs(
    geometry: THREE.BufferGeometry,
    footprint: LocalPoint[],
  ): void {
    const pos = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    const uvs = new Float32Array(pos.count * 2);

    const edgeDistances: number[] = [0];
    let totalPerimeter = 0;
    for (let i = 0; i < footprint.length; i++) {
      const p1 = footprint[i];
      const p2 = footprint[(i + 1) % footprint.length];

      const dist = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      totalPerimeter += dist;
      edgeDistances.push(totalPerimeter);
    }

    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      const pz = pos.getZ(i);
      const ny = normal.getY(i);

      if (Math.abs(ny) > 0.6) {
        uvs[i * 2] = px;
        uvs[i * 2 + 1] = pz;
      } else {
        let bestDistAlongPerimeter = 0;
        let minDistanceToSegment = Infinity;
        for (let seg = 0; seg < footprint.length; seg++) {
          const a = footprint[seg];
          const b = footprint[(seg + 1) % footprint.length];

          const segVecX = b.x - a.x;
          const segVecZ = b.z - a.z;
          const segLenSq = segVecX * segVecX + segVecZ * segVecZ;
          if (segLenSq === 0) continue;

          let t = ((px - a.x) * segVecX + (pz - a.z) * segVecZ) / segLenSq;
          t = Math.max(0, Math.min(1, t));

          const projX = a.x + t * segVecX;
          const projZ = a.z + t * segVecZ;
          const distSq = (px - projX) ** 2 + (pz - projZ) ** 2;
          if (distSq < minDistanceToSegment) {
            minDistanceToSegment = distSq;
            bestDistAlongPerimeter =
              edgeDistances[seg] + t * Math.sqrt(segLenSq);
          }
        }

        uvs[i * 2] = bestDistAlongPerimeter;
        uvs[i * 2 + 1] = py;
      }
    }

    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  }
  private getMaterial(building: Building): THREE.Material {
    const matInfo = building.material;
    const facadeType = (building.attributes.facade.material ??
      building.attributes.general.type ??
      "concrete") as FacadeTextureType;

    const key = `${facadeType}_${matInfo.color}_${matInfo.roughness}`;
    if (materialCache.has(key)) return materialCache.get(key)!;

    const pbr = getProceduralTextures(facadeType, matInfo.color);
    const repeatU = 1 / pbr.tileScale[0];
    const repeatV = 1 / pbr.tileScale[1];
    pbr.map.repeat.set(repeatU, repeatV);
    pbr.roughnessMap.repeat.set(repeatU, repeatV);

    const material = new THREE.MeshStandardMaterial({
      color: matInfo.color,
      map: pbr.map,
      roughnessMap: pbr.roughnessMap,
      roughness: matInfo.roughness,
      metalness: matInfo.metalness,
    });

    materialCache.set(key, material);

    return material;
  }
  public dispose(): void {
    this.instance.geometry.dispose();
  }
}
