import Engine from "./three/core/Engine";

import { fetchBuildings } from "./geo/OSMClient";
import { geoPointToLocal } from "./geo/Projection";

import { type BoundingBox, type GeoPoint } from "./geo/types";

const testArea: BoundingBox = {
  north: 40.7595,
  south: 40.7575,
  east: -73.984,
  west: -73.987,
};

const origin: GeoPoint = { lat: testArea.south, lon: testArea.west };

async function getBuildings() {
  try {
    const data = await fetchBuildings(testArea);
    for (const building of data.elements) {
      if (!building.geometry) continue;
      for (const point of building.geometry) {
        const local = geoPointToLocal(point, origin);
        console.log(local);
      }
    }
  } catch (err) {
    console.error("Failed to load building data:", err);
  }
}

async function main() {
  const engine = new Engine();
  engine.init();

  await getBuildings();
}

main();
