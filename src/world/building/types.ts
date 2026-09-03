import type { LocalPoint, OSMElement } from "../../geo/types";

export type RoofShape =
  | "flat"
  | "gabled"
  | "hipped"
  | "pyramidal"
  | "dome"
  | "skillion"
  | "mansard"
  | "gambrel"
  | "round"
  | "onion";

export interface RoofAttributes {
  shape: RoofShape;
  height: number;
  levels?: number;
  angle?: number;
  direction?: string;
  orientation?: string;
  material?: string;
  colour?: string;
}

export interface BuildingDimensions {
  totalHeight: number;
  minHeight: number;
  levels: number;
  minLevel?: number;
  undergroundLevels?: number;
}

export interface BuildingGeneral {
  type?: string;
  use?: string;
  name?: string;
  altName?: string;
  officialName?: string;
  description?: string;
  operator?: string;
  owner?: string;
  brand?: string;
  ref?: string;
}

export interface BuildingFacade {
  material?: string;
  colour?: string;
  walls?: string;
  structure?: string;
}

export interface BuildingAddress {
  housenumber?: string;
  street?: string;
  unit?: string;
  postcode?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
}

export interface BuildingMetadata {
  website?: string;
  phone?: string;
  wikidata?: string;
  wikipedia?: string;
  source?: string;
}

export interface BuildingAttributes {
  general: BuildingGeneral;
  dimensions: BuildingDimensions;
  roof: RoofAttributes;
  facade: BuildingFacade;
  address: BuildingAddress;
  metadata: BuildingMetadata;
}

export type BuildingFeatureCategory =
  | "entrance"
  | "balcony"
  | "window"
  | "garage"
  | "parking";

export interface BuildingFeature {
  id: number;
  category: BuildingFeatureCategory;
  tags: Record<string, string>;
  point: LocalPoint;
  footprint?: LocalPoint[];
}

export interface Building {
  id: number;
  height: number;
  minHeight: number;
  footprint: LocalPoint[];
  attributes: BuildingAttributes;
  tags?: Record<string, string>;
  features?: BuildingFeature[];
}

export interface LoadedBuilding {
  osm: OSMElement;
  building: Building;
}
