import type { BoundingBox, OSMResponse } from "./types";

export async function fetchBuildings(
  bounds: BoundingBox,
): Promise<OSMResponse> {
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

  const res = await fetch("/api/buildings", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: query,
  });

  if (!res.ok)
    throw new Error(`Overpass request failed: ${res.status} ${res.statusText}`);

  return res.json();
}
