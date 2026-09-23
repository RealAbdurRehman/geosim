import type { LocalPoint } from "../../geo/types";

export interface Building {
  id: number;
  parentId?: number;
  height: number;
  minHeight: number;
  color: string;
  footprint: LocalPoint[];
  tags?: Record<string, string>;
  type?: string;
  wikidata?: string;
  isPart?: boolean;
}

export interface LoadedBuilding {
  building: Building;
}
