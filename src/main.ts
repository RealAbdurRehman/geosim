import Engine from "./three/core/Engine";

import loadBuildings from "./world/building/BuildingLoader";

import BuildingShape from "./world/building/BuildingShape";
import BuildingMesh from "./world/building/BuildingMesh";

import { type BoundingBox, type GeoPoint } from "./geo/types";

const testArea: BoundingBox = {
  north: 40.7605,
  south: 40.7565,
  east: -73.9825,
  west: -73.9885,
};

const origin: GeoPoint = {
  lat: (testArea.north + testArea.south) / 2,
  lon: (testArea.east + testArea.west) / 2,
};

async function main() {
  const engine = new Engine();
  engine.init();

  const loading = document.getElementById("loading")!;
  const error = document.getElementById("error")!;

  try {
    const buildings = await loadBuildings(testArea, origin);
    for (const { osm, building } of buildings) {
      const shape = new BuildingShape(osm, origin);
      const mesh = new BuildingMesh(building, shape);
      engine.add(mesh.instance);
    }

    loading.hidden = true;
  } catch (err) {
    console.error(err);

    loading.hidden = true;
    error.hidden = false;
  }
}

main();
