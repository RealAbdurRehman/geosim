import { type BoundingBox, type OSMResponse } from "./types";

const OVERPASS_API = "https://overpass-api.de/api/interpreter";

export async function getBuildings(bounds: BoundingBox): Promise<OSMResponse> {
  const query = `
    [out:json];
    way["building"](
      ${bounds.south},
      ${bounds.west},
      ${bounds.north},
      ${bounds.east}
    );
    out geom;
  `;

  const res = await fetch(OVERPASS_API, { method: "POST", body: query });
  if (!res.ok)
    throw new Error(`Overpass request failed: ${res.status} ${res.statusText}`);

  return res.json();
}
