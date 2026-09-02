import { fetchBuildings } from "../../geo/OSMClient";
import { geoPointToLocal } from "../../geo/Projection";

import type { LoadedBuilding } from "./types";
import type { BoundingBox, GeoPoint, LocalPoint } from "../../geo/types";

export default async function loadBuildings(
  area: BoundingBox,
  origin: GeoPoint,
): Promise<LoadedBuilding[]> {
  const buildings: LoadedBuilding[] = [];
  const data = await fetchBuildings(area);
  for (const element of data.elements) {
    if (!element.geometry) continue;

    const footprint: LocalPoint[] = [];
    for (const point of element.geometry) {
      const local = geoPointToLocal(point, origin);
      footprint.push(local);
    }

    buildings.push({
      osm: element,
      building: { id: element.id, footprint, tags: element.tags },
    });
  }

  return buildings;
}
