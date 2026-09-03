import { fetchBuildings } from "../../geo/OSMClient";
import { fetchWikidataHeights } from "../../geo/WikidataClient";

import { geoPointToLocal } from "../../geo/Projection";
import { parseBuildingAttributes } from "./BuildingAttributes";

import type { Building, LoadedBuilding } from "./types";
import type {
  BoundingBox,
  GeoPoint,
  LocalPoint,
  OSMElement,
} from "../../geo/types";

function pointsEqual(a: GeoPoint, b: GeoPoint): boolean {
  const EPS = 1e-7;
  return Math.abs(a.lat - b.lat) < EPS && Math.abs(a.lon - b.lon) < EPS;
}

function assembleRings(segments: GeoPoint[][]): GeoPoint[][] {
  const remaining = segments.filter((s) => s.length > 1).map((s) => s.slice());
  const rings: GeoPoint[][] = [];

  while (remaining.length > 0) {
    let ring = remaining.shift()!;
    let extended = true;
    while (extended && !pointsEqual(ring[0], ring[ring.length - 1])) {
      extended = false;
      for (let i = 0; i < remaining.length; i++) {
        const seg = remaining[i];
        if (pointsEqual(ring[ring.length - 1], seg[0])) {
          ring = ring.concat(seg.slice(1));
          remaining.splice(i, 1);
          extended = true;
          break;
        }
        if (pointsEqual(ring[ring.length - 1], seg[seg.length - 1])) {
          ring = ring.concat(seg.slice(0, -1).reverse());
          remaining.splice(i, 1);
          extended = true;
          break;
        }
      }
    }

    rings.push(ring);
  }

  return rings;
}

function relationToWayLikeElements(element: OSMElement): OSMElement[] {
  if (!element.members) return [];
  const outerSegments = element.members
    .filter((m) => m.type === "way" && m.role === "outer" && m.geometry)
    .map((m) => m.geometry!);

  const rings = assembleRings(outerSegments);
  return rings.map((ring, index) => ({
    id: element.id * 1000 + index,
    type: "way",
    geometry: ring,
    tags: element.tags,
  }));
}

function toWayLikeElements(element: OSMElement): OSMElement[] {
  if (element.type === "way") return [element];
  if (element.type === "relation") return relationToWayLikeElements(element);
  return [];
}

function isSurfaceBuilding(tags?: Record<string, string>): boolean {
  if (!tags) return true;
  if (tags["location"] === "underground") return false;

  const layer = Number.parseInt(tags["layer"] ?? "0", 10);
  if (Number.isFinite(layer) && layer < 0) return false;

  return true;
}

function isBuildingPart(tags?: Record<string, string>): boolean {
  return !!tags?.["building:part"];
}

function footprintCentroid(footprint: LocalPoint[]): LocalPoint {
  const sum = footprint.reduce(
    (acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }),
    { x: 0, z: 0 },
  );
  return { x: sum.x / footprint.length, z: sum.z / footprint.length };
}

function pointInPolygon(point: LocalPoint, polygon: LocalPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const zi = polygon[i].z;
    const xj = polygon[j].x;
    const zj = polygon[j].z;

    const intersects =
      zi > point.z !== zj > point.z &&
      point.x < ((xj - xi) * (point.z - zi)) / (zj - zi) + xi;

    if (intersects) inside = !inside;
  }
  return inside;
}

interface ParsedElement {
  osm: OSMElement;
  building: Building;
  isPart: boolean;
}

export default async function loadBuildings(
  area: BoundingBox,
  origin: GeoPoint,
): Promise<LoadedBuilding[]> {
  const data = await fetchBuildings(area);
  const parsed: ParsedElement[] = [];

  for (const rawElement of data.elements) {
    for (const element of toWayLikeElements(rawElement)) {
      if (!element.geometry) continue;
      if (!isSurfaceBuilding(element.tags)) continue;

      const footprint: LocalPoint[] = element.geometry.map((point) =>
        geoPointToLocal(point, origin),
      );
      const attributes = parseBuildingAttributes(element.tags);

      parsed.push({
        osm: element,
        isPart: isBuildingPart(element.tags),
        building: {
          id: element.id,
          height: attributes.dimensions.totalHeight,
          minHeight: attributes.dimensions.minHeight,
          footprint,
          attributes,
          tags: element.tags,
        },
      });
    }
  }

  const parts = parsed.filter((p) => p.isPart);
  const shells = parsed.filter((p) => !p.isPart);

  const shellsWithParts = new Set<number>();
  for (const shell of shells) {
    for (const part of parts) {
      const centroid = footprintCentroid(part.building.footprint);
      if (pointInPolygon(centroid, shell.building.footprint)) {
        shellsWithParts.add(shell.building.id);
        break;
      }
    }
  }

  const renderable = [
    ...parts,
    ...shells.filter((s) => !shellsWithParts.has(s.building.id)),
  ];

  const needsWikidataHeight: { building: Building; qid: string }[] = [];
  for (const { building } of renderable) {
    const hasRealDimensionData = !!(
      building.tags?.["height"] || building.tags?.["building:levels"]
    );
    if (!hasRealDimensionData && building.attributes.metadata.wikidata)
      needsWikidataHeight.push({
        building,
        qid: building.attributes.metadata.wikidata,
      });
  }

  const qids = [...new Set(needsWikidataHeight.map((n) => n.qid))];
  const wikidataHeights = await fetchWikidataHeights(qids);
  for (const { building, qid } of needsWikidataHeight) {
    const height = wikidataHeights[qid];
    if (height) building.height = height;
  }

  return renderable.map(({ osm, building }) => ({ osm, building }));
}
