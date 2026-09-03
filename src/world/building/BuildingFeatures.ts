import { geoPointToLocal } from "../../geo/Projection";

import type { BuildingFeature, BuildingFeatureCategory } from "./types";
import type { GeoPoint, LocalPoint, OSMElement } from "../../geo/types";

function categorize(
  tags?: Record<string, string>,
): BuildingFeatureCategory | null {
  if (!tags) return null;
  if (tags["window"]) return "window";
  if (tags["entrance"]) return "entrance";
  if (tags["amenity"] === "parking") return "parking";
  if (tags["building:part"] === "balcony") return "balcony";
  if (tags["building"] === "garage" || tags["building"] === "garages")
    return "garage";

  return null;
}

function centroid(points: LocalPoint[]): LocalPoint {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }), {
    x: 0,
    z: 0,
  });

  return { x: sum.x / points.length, z: sum.z / points.length };
}

export function extractFeatures(
  elements: OSMElement[],
  origin: GeoPoint,
): BuildingFeature[] {
  const features: BuildingFeature[] = [];
  for (const element of elements) {
    const category = categorize(element.tags);
    if (!category) continue;

    if (
      element.type === "node" &&
      element.lat !== undefined &&
      element.lon !== undefined
    ) {
      features.push({
        id: element.id,
        category,
        tags: element.tags!,
        point: geoPointToLocal({ lat: element.lat, lon: element.lon }, origin),
      });

      continue;
    }

    if (element.geometry?.length) {
      const footprint = element.geometry.map((p) => geoPointToLocal(p, origin));
      features.push({
        id: element.id,
        category,
        tags: element.tags!,
        point: centroid(footprint),
        footprint,
      });
    }
  }

  return features;
}
