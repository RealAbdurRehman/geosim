import Config from "../config/BuildingConfig";

import type { Building } from "../types";
import type { LocalPoint } from "../../../geo/types";

function computeFootprintBounds(footprint: LocalPoint[]): {
  width: number;
  depth: number;
  area: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const p of footprint) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }

  let area = 0;
  for (let i = 0, j = footprint.length - 1; i < footprint.length; j = i++)
    area +=
      (footprint[j].x + footprint[i].x) * (footprint[j].z - footprint[i].z);

  area = Math.abs(area / 2);
  return { width: maxX - minX, depth: maxZ - minZ, area };
}

function isTooSmallForWindows(building: Building): boolean {
  const { minFootprintDimension, minFootprintArea, minHeight } =
    Config.minFacadeDimensions;

  const height = building.height - building.minHeight;
  if (height < minHeight) return true;

  const { width, depth, area } = computeFootprintBounds(building.footprint);
  if (width < minFootprintDimension || depth < minFootprintDimension)
    return true;
  if (area < minFootprintArea) return true;

  return false;
}

export default function shouldSkipFacadeWindows(building: Building): boolean {
  const type = building.attributes.general.type;
  const part = building.tags?.["building:part"];

  if (type && Config.noWindowBuildingTypes.includes(type)) return true;
  if (part && Config.noWindowBuildingTypes.includes(part)) return true;
  if (isTooSmallForWindows(building)) return true;

  return false;
}
