import Config from "./config/BuildingConfig";

import type { LocalPoint } from "../../geo/types";
import type { Building, BuildingFeature } from "./types";

function pointInPolygon(point: LocalPoint, polygon: LocalPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      zi = polygon[i].z;
    const xj = polygon[j].x,
      zj = polygon[j].z;

    const intersects =
      zi > point.z !== zj > point.z &&
      point.x < ((xj - xi) * (point.z - zi)) / (zj - zi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

function distanceToPolygon(point: LocalPoint, polygon: LocalPoint[]): number {
  let min = Infinity;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j],
      b = polygon[i];
    const dx = b.x - a.x,
      dz = b.z - a.z;

    const lenSq = dx * dx + dz * dz;
    const t =
      lenSq === 0
        ? 0
        : Math.max(
            0,
            Math.min(1, ((point.x - a.x) * dx + (point.z - a.z) * dz) / lenSq),
          );

    const dist = Math.hypot(point.x - (a.x + t * dx), point.z - (a.z + t * dz));
    if (dist < min) min = dist;
  }

  return min;
}

function findBestMatch(
  feature: BuildingFeature,
  buildings: Building[],
  maxDist: number,
): Building | null {
  const candidates: { building: Building; distance: number }[] = [];
  for (const building of buildings) {
    const inside = pointInPolygon(feature.point, building.footprint);
    const distance = inside
      ? 0
      : distanceToPolygon(feature.point, building.footprint);

    if (distance <= maxDist) candidates.push({ building, distance });
  }

  if (candidates.length === 0) return null;

  const featureHousenumber = feature.tags["addr:housenumber"];
  if (featureHousenumber) {
    const addressMatch = candidates.find(
      (c) => c.building.attributes.address.housenumber === featureHousenumber,
    );

    if (addressMatch) return addressMatch.building;
  }

  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0].building;
}

export function attachFeaturesToBuildings(
  buildings: Building[],
  features: BuildingFeature[],
): Map<number, BuildingFeature[]> {
  const byBuilding = new Map<number, BuildingFeature[]>();
  for (const feature of features) {
    if (feature.category === "garage") continue;

    const maxDist = Config.maxFeatureAttachDistance[feature.category] ?? 15;
    const best = findBestMatch(feature, buildings, maxDist);
    if (!best) continue;

    const list = byBuilding.get(best.id) ?? [];
    list.push(feature);
    byBuilding.set(best.id, list);
  }

  return byBuilding;
}
