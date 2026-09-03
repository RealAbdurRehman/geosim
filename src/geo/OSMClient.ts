import type { BoundingBox, OSMResponse } from "./types";

export async function fetchBuildings(
  bounds: BoundingBox,
): Promise<OSMResponse> {
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
  const query = `
    [out:json];
    (
      way["building"](${bbox});
      way["building:part"](${bbox});
      way["window"](${bbox});
      way["amenity"="parking"](${bbox});

      relation["building"]["type"="multipolygon"](${bbox});
      relation["amenity"="parking"]["type"="multipolygon"](${bbox});

      node["window"](${bbox});
      node["entrance"](${bbox});
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
