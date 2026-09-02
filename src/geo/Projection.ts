import type { LocalPoint, GeoPoint } from "./types";

const METERS_PER_DEGREE_LAT = 111_320;

export function geoPointToLocal(point: GeoPoint, origin: GeoPoint): LocalPoint {
  const latRadians = (origin.lat * Math.PI) / 180;
  const metersPerDegreeLon = METERS_PER_DEGREE_LAT * Math.cos(latRadians);

  const x = (point.lon - origin.lon) * metersPerDegreeLon;
  const z = -(point.lat - origin.lat) * METERS_PER_DEGREE_LAT;
  return { x, z };
}
