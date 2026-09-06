import Config from "../config/BuildingConfig";
import type { Building } from "../types";
import type { LocalPoint } from "../../../geo/types";

function computeFootprintArea(footprint: LocalPoint[]): number {
  let area = 0;
  for (let i = 0, j = footprint.length - 1; i < footprint.length; j = i++) {
    area +=
      (footprint[j].x + footprint[i].x) * (footprint[j].z - footprint[i].z);
  }
  return Math.abs(area / 2);
}

function computeMinWidth(footprint: LocalPoint[]): number {
  let minWidth = Infinity;

  for (let i = 0, j = footprint.length - 1; i < footprint.length; j = i++) {
    const a = footprint[j];
    const b = footprint[i];
    const edgeX = b.x - a.x;
    const edgeZ = b.z - a.z;
    const edgeLen = Math.hypot(edgeX, edgeZ);
    if (edgeLen === 0) continue;

    const normalX = -edgeZ / edgeLen;
    const normalZ = edgeX / edgeLen;

    let min = Infinity;
    let max = -Infinity;
    for (const p of footprint) {
      const proj = p.x * normalX + p.z * normalZ;
      if (proj < min) min = proj;
      if (proj > max) max = proj;
    }

    const width = max - min;
    if (width < minWidth) minWidth = width;
  }

  return minWidth === Infinity ? 0 : minWidth;
}

function isTooSmallForWindows(building: Building): boolean {
  const { minFootprintDimension, minFootprintArea, minHeight } =
    Config.minFacadeDimensions;

  const height = building.height - building.minHeight;
  if (height < minHeight) return true;

  const area = computeFootprintArea(building.footprint);
  if (area < minFootprintArea) return true;

  const minWidth = computeMinWidth(building.footprint);
  if (minWidth < minFootprintDimension) return true;

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
