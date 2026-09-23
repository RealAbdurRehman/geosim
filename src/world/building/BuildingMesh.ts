import * as THREE from "three";

import BuildingShape from "./BuildingShape";
import enableObjectShadow from "../../utils/enableObjectShadow";

import { createOsmBuildingsMaterial } from "./materials/BuildingMaterial";
import {
  resolveWallColor,
  resolveRoofColor,
  safeColor,
  DEFAULT_WALL_COLOR,
  DEFAULT_ROOF_COLOR,
} from "./materials/BuildingColors";

import type { Building } from "./types";

const NO_WINDOWS_TYPES = new Set([
  "garage",
  "garages",
  "carport",
  "shed",
  "greenhouse",
  "hut",
  "cabin",
  "roof",
  "canopy",
  "ruins",
  "silo",
  "hangar",
  "service",
  "elevator",
  "column",
  "storage_tank",
  "tower",
  "antenna",
  "chimney",
  "mast",
  "obelisk",
  "monument",
  "memorial",
  "water_tower",
  "cooling_tower",
]);

const NO_WINDOWS_MAN_MADE = new Set([
  "tower",
  "mast",
  "antenna",
  "chimney",
  "water_tower",
  "cooling_tower",
  "windmill",
  "crane",
  "storage_tank",
  "silo",
  "obelisk",
  "bridge",
  "lighthouse",
]);

function footprintArea(fp: { x: number; z: number }[]): number {
  let area = 0;
  for (let i = 0, j = fp.length - 1; i < fp.length; j = i++)
    area += (fp[j].x + fp[i].x) * (fp[j].z - fp[i].z);

  return Math.abs(area / 2);
}

export function getFacadeStyle(building: Building): number {
  const height = building.height - building.minHeight;
  const tags = building.tags ?? {};

  for (const key of ["building", "building:part", "man_made", "tower:type"]) {
    const v = tags[key]?.toLowerCase();
    if (v && NO_WINDOWS_TYPES.has(v)) return 0;
  }

  const manMade = tags["man_made"]?.toLowerCase();
  if (manMade && NO_WINDOWS_MAN_MADE.has(manMade)) return 0;
  if (height < 4) return 0;

  const area = footprintArea(building.footprint);
  if (area < 6) return 0;

  const sqrtArea = Math.sqrt(area);
  if (height / sqrtArea > 10) return 0;

  const hash = Math.abs(Math.sin(building.id * 12.9898) * 43758.5453) % 1;
  if (height >= 40) return hash < 0.5 ? 2 : 3;

  return hash < 0.7 ? 1 : 2;
}

function nudgeFor(id: number): [number, number, number] {
  const h1 = Math.abs(Math.sin(id * 12.9898) * 43758.5453) % 1;
  const h2 = Math.abs(Math.sin(id * 78.233) * 43758.5453) % 1;
  const h3 = Math.abs(Math.sin(id * 39.425) * 43758.5453) % 1;
  return [(h1 - 0.5) * 0.3, (h2 - 0.5) * 0.3, (h3 - 0.5) * 0.3];
}

export default class BuildingMesh {
  public readonly instance: THREE.Mesh;
  constructor(building: Building, shape: BuildingShape) {
    const geometry = this.buildGeometry(building, shape);
    const material = createOsmBuildingsMaterial();

    this.instance = new THREE.Mesh(geometry, material);
    enableObjectShadow({ object: this.instance });
  }
  private applyPatternOffset(
    geometry: THREE.BufferGeometry,
    buildingId: number,
  ): void {
    const count = geometry.attributes.position.count;
    const arr = new Float32Array(count * 2);

    const hash1 = Math.abs(Math.sin(buildingId * 12.9898) * 43758.5453) % 1;
    const hash2 = Math.abs(Math.sin(buildingId * 78.233) * 43758.5453) % 1;

    const offsetU = hash1 * 3.5;
    const offsetV = hash2 * 3.0;

    for (let i = 0; i < count; i++) {
      arr[i * 2] = offsetU;
      arr[i * 2 + 1] = offsetV;
    }

    geometry.setAttribute("aPatternOffset", new THREE.BufferAttribute(arr, 2));
  }
  private buildGeometry(
    building: Building,
    shape: BuildingShape,
  ): THREE.BufferGeometry {
    const totalH = Math.max(building.height - building.minHeight, 0.1);

    const wallColor = safeColor(
      building.color ||
        resolveWallColor(building.id, building.tags, building.type),
      DEFAULT_WALL_COLOR,
    );
    const roofColor = safeColor(
      resolveRoofColor(building.id, building.tags),
      DEFAULT_ROOF_COLOR,
    );

    let wallGeom: THREE.BufferGeometry = new THREE.ExtrudeGeometry(
      shape.instance,
      { depth: totalH, bevelEnabled: false },
    );
    wallGeom.rotateX(-Math.PI / 2);
    wallGeom.clearGroups();

    if (wallGeom.attributes.uv) wallGeom.deleteAttribute("uv");
    if (wallGeom.index) wallGeom = wallGeom.toNonIndexed();
    this.applyVertexColors(wallGeom, wallColor, roofColor);

    const [dx, dy, dz] = nudgeFor(building.id);
    wallGeom.translate(dx, building.minHeight + dy, dz);

    this.applyFloatAttribute(wallGeom, "aHeight", building.height);
    const sharedId = building.parentId ?? building.id;
    this.applyFloatAttribute(
      wallGeom,
      "aFacadeStyle",
      getFacadeStyle({ ...building, id: sharedId }),
    );
    this.applyPatternOffset(wallGeom, sharedId);

    return wallGeom;
  }
  private applyVertexColors(
    geometry: THREE.BufferGeometry,
    wallColorHex: string,
    roofColorHex: string,
  ): void {
    const normal = geometry.attributes.normal;
    const count = geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);

    const wall = new THREE.Color(wallColorHex);
    const roof = new THREE.Color(roofColorHex);

    for (let i = 0; i < count; i++) {
      const ny = normal.getY(i);

      const isRoof = ny > 0.6;
      const c = isRoof ? roof : wall;

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }
  private applyFloatAttribute(
    geometry: THREE.BufferGeometry,
    name: string,
    value: number,
  ): void {
    const count = geometry.attributes.position.count;
    const arr = new Float32Array(count);
    arr.fill(value);
    geometry.setAttribute(name, new THREE.BufferAttribute(arr, 1));
  }
}
