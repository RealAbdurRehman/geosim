import { getBuildings } from "./geo/OSMClient";
import { geoPointToLocal } from "./geo/Projection";

import { type BoundingBox, type GeoPoint } from "./geo/types";

const testArea: BoundingBox = {
  north: 40.7595,
  south: 40.7575,
  east: -73.984,
  west: -73.987,
};

const origin: GeoPoint = { lat: testArea.south, lon: testArea.west };

const northEl = document.getElementById("north")!;
const southEl = document.getElementById("south")!;
const eastEl = document.getElementById("east")!;
const westEl = document.getElementById("west")!;

const dataEl = document.getElementById("data")!;

async function main() {
  northEl.textContent = String(testArea.north);
  southEl.textContent = String(testArea.south);
  eastEl.textContent = String(testArea.east);
  westEl.textContent = String(testArea.west);

  try {
    const data = await getBuildings(testArea);

    let html = ``;
    for (const building of data.elements) {
      if (!building.geometry) continue;
      for (const point of building.geometry) {
        const local = geoPointToLocal(point, origin);
        html += `
        <div>${JSON.stringify(local, null, 2)}</div>
        <hr />
        `;
      }
    }

    dataEl.innerHTML = html;
  } catch (err) {
    console.error("Failed to load building data:", err);
    dataEl.textContent = "Failed to load building data.";
  }
}

main();
