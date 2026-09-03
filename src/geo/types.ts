export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface LocalPoint {
  x: number;
  z: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface OSMMember {
  type: string;
  ref: number;
  role: string;
  geometry?: GeoPoint[];
}

export interface OSMElement {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  nodes?: number[];
  geometry?: GeoPoint[];
  members?: OSMMember[];
  tags?: Record<string, string>;
  bounds?: {
    minlat: number;
    minlon: number;
    maxlat: number;
    maxlon: number;
  };
}

export interface OSMResponse {
  version: number;
  generator: string;
  elements: OSMElement[];
}
