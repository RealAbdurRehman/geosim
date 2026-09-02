import type { LocalPoint, OSMElement } from "../../geo/types";

export interface Building {
  id: number;
  footprint: LocalPoint[];
  tags?: Record<string, string>;
}

export interface LoadedBuilding {
  osm: OSMElement;
  building: Building;
}
