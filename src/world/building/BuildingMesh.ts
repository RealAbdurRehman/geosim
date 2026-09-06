import * as THREE from "three";

import BuildingShape from "./BuildingShape";
import enableObjectShadow from "../../utils/enableObjectShadow";
import getProceduralTextures from "./materials/ProceduralTextures";
import resolveWindowStyleKey from "./helpers/ResolveWindowStyleKey";
import shouldSkipFacadeWindows from "./config/ShouldSkipFacadeWindows";

import type { Building, FacadeTextureType } from "./types";

function verticalNudgeFor(id: number): number {
  const hash = Math.abs(Math.sin(id) * 10000);
  return (hash % 1) * 0.2;
}

const wallMaterialCache = new Map<string, THREE.MeshStandardMaterial>();
const capMaterialCache = new Map<string, THREE.MeshStandardMaterial>();

export default class BuildingMesh {
  public readonly instance: THREE.Mesh;
  constructor(building: Building, shape: BuildingShape) {
    const geometry = this.buildMetricGeometry(building, shape);
    const wallMaterial = this.getWallMaterial(building);
    const capMaterial = this.getCapMaterial(building);
    const materials = this.assignGroupMaterials(
      geometry,
      wallMaterial,
      capMaterial,
    );

    this.instance = new THREE.Mesh(geometry, materials);
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

    this.applyMetricUVs(geometry);
    return geometry;
  }
  private applyMetricUVs(geometry: THREE.BufferGeometry): void {
    const pos = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    const uvs = new Float32Array(pos.count * 2);

    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      const pz = pos.getZ(i);
      const nx = normal.getX(i);
      const ny = normal.getY(i);
      const nz = normal.getZ(i);

      if (Math.abs(ny) > 0.6) {
        uvs[i * 2] = px;
        uvs[i * 2 + 1] = pz;
      } else {
        const tangentX = -nz;
        const tangentZ = nx;
        uvs[i * 2] = px * tangentX + pz * tangentZ;
        uvs[i * 2 + 1] = py;
      }
    }

    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  }
  private assignGroupMaterials(
    geometry: THREE.BufferGeometry,
    wallMaterial: THREE.Material,
    capMaterial: THREE.Material,
  ): THREE.Material[] {
    const normal = geometry.attributes.normal;
    const index = geometry.index;
    const materials: THREE.Material[] = [];

    for (const group of geometry.groups) {
      const materialIndex = group.materialIndex ?? 0;
      const vertexIndex = index ? index.getX(group.start) : group.start;
      const ny = normal.getY(vertexIndex);
      materials[materialIndex] =
        Math.abs(ny) > 0.6 ? capMaterial : wallMaterial;
    }

    return materials;
  }
  // private getWallMaterial(building: Building): THREE.Material {
  //   const matInfo = building.material;
  //   const facadeType = (building.attributes.facade.material ??
  //     building.attributes.general.type ??
  //     "concrete") as FacadeTextureType;

  //   const hasWindowData =
  //     building.features?.some((f) => f.category === "window") ?? false;
  //   const windowStyleKey = hasWindowData
  //     ? "blank"
  //     : resolveWindowStyleKey(building.attributes.general.type);

  //   const key = `${facadeType}_${matInfo.color}_${matInfo.roughness}_${windowStyleKey}`;
  //   if (wallMaterialCache.has(key)) return wallMaterialCache.get(key)!;

  //   const pbr = getProceduralTextures(
  //     facadeType,
  //     matInfo.color,
  //     windowStyleKey,
  //   );
  //   const repeatU = 1 / pbr.tileScale[0];
  //   const repeatV = 1 / pbr.tileScale[1];
  //   pbr.map.repeat.set(repeatU, repeatV);
  //   pbr.roughnessMap.repeat.set(repeatU, repeatV);

  //   const material = new THREE.MeshStandardMaterial({
  //     color: matInfo.color,
  //     map: pbr.map,
  //     roughnessMap: pbr.roughnessMap,
  //     roughness: matInfo.roughness,
  //     metalness: matInfo.metalness,
  //   });

  //   wallMaterialCache.set(key, material);
  //   return material;
  // }
  private getWallMaterial(building: Building): THREE.Material {
    const matInfo = building.material;
    const facadeType = (building.attributes.facade.material ??
      building.attributes.general.type ??
      "concrete") as FacadeTextureType;

    const skipFacadeWindows = shouldSkipFacadeWindows(building);
    const hasWindowData =
      building.features?.some((f) => f.category === "window") ?? false;
    const windowStyleKey = hasWindowData
      ? "blank"
      : resolveWindowStyleKey(building.attributes.general.type);

    const key = skipFacadeWindows
      ? `plain_${matInfo.color}`
      : `${facadeType}_${matInfo.color}_${matInfo.roughness}_${windowStyleKey}`;
    if (wallMaterialCache.has(key)) return wallMaterialCache.get(key)!;

    const pbr = getProceduralTextures(
      facadeType,
      matInfo.color,
      windowStyleKey,
      skipFacadeWindows,
    );
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

    wallMaterialCache.set(key, material);
    return material;
  }
  private getCapMaterial(building: Building): THREE.Material {
    const matInfo = building.material;
    const key = `${matInfo.color}_${matInfo.roughness}_${matInfo.metalness}`;
    if (capMaterialCache.has(key)) return capMaterialCache.get(key)!;

    const material = new THREE.MeshStandardMaterial({
      color: matInfo.color,
      roughness: Math.min(matInfo.roughness + 0.1, 1),
      metalness: matInfo.metalness,
    });

    capMaterialCache.set(key, material);
    return material;
  }
  public dispose(): void {
    this.instance.geometry.dispose();
  }
}
