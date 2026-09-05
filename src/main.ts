import Engine from "./three/core/Engine";
import loadBuildings from "./world/building/BuildingLoader";
import { batchBuildings } from "./world/building/BuildingBatcher";

import { type BoundingBox, type GeoPoint } from "./geo/types";

const testArea: BoundingBox = {
  north: 40.7625,
  south: 40.7545,
  east: -73.9795,
  west: -73.9915,
};

const origin: GeoPoint = {
  lat: (testArea.north + testArea.south) / 2,
  lon: (testArea.east + testArea.west) / 2,
};

const latitude = document.getElementById("latitude")!;
const longitude = document.getElementById("longitude")!;
latitude.textContent = `Latitude: ${testArea.south.toFixed(4)}° — ${testArea.north.toFixed(4)}°`;
longitude.textContent = `Longitude: ${testArea.west.toFixed(4)}° — ${testArea.east.toFixed(4)}°`;

const loading = document.getElementById("loading")!;
const error = document.getElementById("error")!;
const retry = document.getElementById("retry")!;

async function loadWorld(engine: Engine) {
  loading.hidden = false;
  error.hidden = true;

  try {
    const buildings = await loadBuildings(testArea, origin);
    const batchedMeshes = batchBuildings(buildings);
    for (const mesh of batchedMeshes) engine.add(mesh);

    loading.hidden = true;
  } catch (err) {
    console.error("Failed to load buildings:", err);

    loading.hidden = true;
    error.hidden = false;
  }
}

async function main() {
  const engine = new Engine();
  engine.init();

  retry.addEventListener("click", () => loadWorld(engine));
  await loadWorld(engine);
}

main();
